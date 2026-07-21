#!/usr/bin/env bash
# Deploy BUU GET to K3s — โครงสร้าง repo ปัจจุบัน: apps/backend, apps/frontend
#
# ตัวแปรจาก pipeline (export ก่อนรันสคริปต์):
#   export PROJECT_NAME='buu-get-dev'
#   export NODE_VERSION='22.12'
#   export K8S_NAMESPACE='default'
#
# Azure DevOps SSH task:
#   export PROJECT_NAME='$(PROJECT_NAME)'
#   export NODE_VERSION='$(NODE_VERSION)'
#   bash /home/webdev/$(PROJECT_NAME)/public_html/scripts/deploy-k3s.sh

set -euo pipefail

PROJECT_NAME="${PROJECT_NAME:-buu-get-dev}"
NODE_VERSION="${NODE_VERSION:-22.12}"
K8S_NAMESPACE="${K8S_NAMESPACE:-default}"
ROLLOUT_TIMEOUT="${ROLLOUT_TIMEOUT:-300s}"

PROJECT_DIR="/home/webdev/${PROJECT_NAME}"
PUBLIC_HTML="${PROJECT_DIR}/public_html"
BACKEND_MAIN="${PUBLIC_HTML}/apps/backend/dist/main.js"
FRONTEND_INDEX="${PUBLIC_HTML}/apps/frontend/dist/spa/index.html"
FRONTEND_DEPLOY="${PROJECT_NAME}-frontend"

log() { echo "[deploy-k3s] $*"; }

# ---------------------------------------------------------------------------
# 0. ตรวจว่า build artifacts มีอยู่ก่อน deploy
# ---------------------------------------------------------------------------
if [[ ! -f "${BACKEND_MAIN}" ]]; then
  log "ERROR: ไม่พบ backend build → ${BACKEND_MAIN}"
  log "       ตรวจว่า pipeline build backend แล้ว (npm run build → dist/main.js)"
  exit 1
fi

if [[ ! -f "${FRONTEND_INDEX}" ]]; then
  log "ERROR: ไม่พบ frontend build → ${FRONTEND_INDEX}"
  log "       ตรวจว่า pipeline build Quasar SPA แล้ว (output: apps/frontend/dist/spa)"
  exit 1
fi

log "PROJECT_NAME=${PROJECT_NAME} NODE_VERSION=${NODE_VERSION} NAMESPACE=${K8S_NAMESPACE}"

cp /root/k3s-temp-back/* "${PROJECT_DIR}/"
cd "${PROJECT_DIR}"

# ---------------------------------------------------------------------------
# 1. แทนที่ชื่อโปรเจกต์ (K8S_PROJECT_NAME) ในทุกไฟล์ .yml
# ---------------------------------------------------------------------------
for f in deployment-k3s.yml service-k3s.yml ingress-k3s.yml frontend-k3s.yml; do
  sed -i "s|K8S_PROJECT_NAME|${PROJECT_NAME}|g" "$f"
done

# ---------------------------------------------------------------------------
# 2. ปรับ Backend — path และ Node version
# ---------------------------------------------------------------------------
sed -i 's|apps/backend/dist/src/main.js|apps/backend/dist/main.js|g' deployment-k3s.yml
sed -i 's|apps/api/dist/src/main.js|apps/backend/dist/main.js|g' deployment-k3s.yml
sed -i 's|public_html/backend/|public_html/apps/backend/|g' deployment-k3s.yml
sed -i 's|/backend/dist/src/main.js|/apps/backend/dist/main.js|g' deployment-k3s.yml
sed -i 's|/backend/dist/main.js|/apps/backend/dist/main.js|g' deployment-k3s.yml
sed -i 's|/backend/src/main.js|/apps/backend/dist/main.js|g' deployment-k3s.yml
sed -i 's|/backend/src/types/main.js|/apps/backend/dist/main.js|g' deployment-k3s.yml
sed -i "s|22.12|${NODE_VERSION}|g" deployment-k3s.yml
sed -i "s|20.19|${NODE_VERSION}|g" deployment-k3s.yml
sed -i 's|apps/api|apps/backend|g' deployment-k3s.yml

# ---------------------------------------------------------------------------
# 3. ปรับ Frontend — Quasar SPA build ไปที่ apps/frontend/dist/spa
#    ห้าม sed แบบ public_html/frontend/dist → .../spa ทั่วไฟล์
#    เพราะจะทับ path ที่มี /spa อยู่แล้ว → .../dist/spa/spa (FailedMount)
# ---------------------------------------------------------------------------
sed -i 's|apps/frontend/dist/spa/spa|apps/frontend/dist/spa|g' frontend-k3s.yml
sed -i 's|apps/web/dist/spa|apps/frontend/dist/spa|g' frontend-k3s.yml
sed -i 's|apps/web/dist|apps/frontend/dist/spa|g' frontend-k3s.yml
sed -i 's|public_html/frontend/dist/spa|public_html/apps/frontend/dist/spa|g' frontend-k3s.yml
sed -i 's|public_html/frontend/dist|public_html/apps/frontend/dist/spa|g' frontend-k3s.yml
sed -i 's|frontend/dist/spa/spa|apps/frontend/dist/spa|g' frontend-k3s.yml
sed -i "s|public_html/backend/index.html|public_html/apps/frontend/dist/spa/index.html|g" frontend-k3s.yml
sed -i "s|/public_html/backend;|/public_html/apps/frontend/dist/spa;|g" frontend-k3s.yml
sed -i "s|/public_html/backend |/public_html/apps/frontend/dist/spa |g" frontend-k3s.yml

if grep -q 'dist/spa/spa' frontend-k3s.yml; then
  log "ERROR: frontend hostPath ยังผิด (dist/spa/spa)"
  grep -E 'path:|public_html' frontend-k3s.yml || true
  exit 1
fi

# ---------------------------------------------------------------------------
# 4. แก้ Nginx proxy_pass — ตัด /api prefix ก่อนส่ง NestJS
# ---------------------------------------------------------------------------
sed -i "s|proxy_pass http://${PROJECT_NAME}:3000;|proxy_pass http://${PROJECT_NAME}:3000/;|g" frontend-k3s.yml
sed -i 's|proxy_pass http://buu-get-dev:3000;|proxy_pass http://'"${PROJECT_NAME}"':3000/;|g' frontend-k3s.yml

# ---------------------------------------------------------------------------
# 5. คัดลอก .env
# ---------------------------------------------------------------------------
cp "${PUBLIC_HTML}/.env" "${PUBLIC_HTML}/apps/backend/.env" 2>/dev/null || true

log "frontend static path บน server:"
ls -la "${PUBLIC_HTML}/apps/frontend/dist/spa/" | head -5

log "hostPath / nginx root ใน manifest:"
grep -E 'hostPath:|root |alias |public_html' frontend-k3s.yml || true

# ---------------------------------------------------------------------------
# 6. Apply Kubernetes manifests
# ---------------------------------------------------------------------------
apply_deployment() {
  local err_file
  err_file="$(mktemp)"
  if kubectl apply -f deployment-k3s.yml -n "${K8S_NAMESPACE}" 2>"${err_file}"; then
    rm -f "${err_file}"
    return 0
  fi

  if grep -qE 'spec\.selector|field is immutable' "${err_file}"; then
    log "WARN: Deployment selector ไม่ตรงกับ cluster — ใช้ kubectl replace --force"
    cat "${err_file}" >&2
    rm -f "${err_file}"
    kubectl replace --force -f deployment-k3s.yml -n "${K8S_NAMESPACE}"
    return 0
  fi

  cat "${err_file}" >&2
  rm -f "${err_file}"
  return 1
}

apply_deployment
kubectl apply -f service-k3s.yml -n "${K8S_NAMESPACE}"
kubectl apply -f ingress-k3s.yml -n "${K8S_NAMESPACE}"
kubectl apply -f frontend-k3s.yml -n "${K8S_NAMESPACE}"

rm -f deployment-k3s.yml service-k3s.yml ingress-k3s.yml frontend-k3s.yml

# ---------------------------------------------------------------------------
# 7. Restart + รอ rollout
# ---------------------------------------------------------------------------
wait_rollout() {
  local deploy_name="$1"
  local app_label="${2:-${deploy_name}}"

  log "รอ rollout: deployment/${deploy_name} (timeout=${ROLLOUT_TIMEOUT})"
  if kubectl rollout status "deployment/${deploy_name}" -n "${K8S_NAMESPACE}" --timeout="${ROLLOUT_TIMEOUT}"; then
    return 0
  fi

  log "ERROR: rollout ล้มเหลว → deployment/${deploy_name}"
  kubectl get pods -n "${K8S_NAMESPACE}" -l "app=${app_label}" -o wide 2>/dev/null || \
    kubectl get pods -n "${K8S_NAMESPACE}" | grep "${deploy_name}" || true

  kubectl describe deployment "${deploy_name}" -n "${K8S_NAMESPACE}" 2>/dev/null | tail -25 || true

  local pod
  pod="$(kubectl get pods -n "${K8S_NAMESPACE}" -l "app=${app_label}" \
    --sort-by=.metadata.creationTimestamp \
    -o jsonpath='{.items[-1].metadata.name}' 2>/dev/null || true)"

  if [[ -z "${pod}" ]]; then
    pod="$(kubectl get pods -n "${K8S_NAMESPACE}" --no-headers 2>/dev/null \
      | grep "${deploy_name}" | awk '{print $1}' | tail -1 || true)"
  fi

  if [[ -n "${pod}" ]]; then
    log "describe pod: ${pod}"
    kubectl describe pod "${pod}" -n "${K8S_NAMESPACE}" 2>/dev/null | tail -40 || true
    log "logs pod: ${pod}"
    kubectl logs "${pod}" -n "${K8S_NAMESPACE}" --tail=80 2>/dev/null || true
    kubectl logs "${pod}" -n "${K8S_NAMESPACE}" --previous --tail=80 2>/dev/null || true
  fi

  # pod เก่าค้าง Terminating → ลบ force แล้วรอ rollout อีกครั้ง
  local terminating
  terminating="$(kubectl get pods -n "${K8S_NAMESPACE}" --no-headers 2>/dev/null \
    | grep "${deploy_name}" | grep Terminating | awk '{print $1}' || true)"

  if [[ -n "${terminating}" ]]; then
    log "WARN: พบ pod ค้าง Terminating — ลบ force"
    while IFS= read -r p; do
      [[ -n "${p}" ]] && kubectl delete pod "${p}" -n "${K8S_NAMESPACE}" --force --grace-period=0 || true
    done <<< "${terminating}"

    if kubectl rollout status "deployment/${deploy_name}" -n "${K8S_NAMESPACE}" --timeout=120s; then
      return 0
    fi
  fi

  return 1
}

kubectl rollout restart "deployment/${PROJECT_NAME}" -n "${K8S_NAMESPACE}"
kubectl rollout restart "deployment/${FRONTEND_DEPLOY}" -n "${K8S_NAMESPACE}"

# รอ backend เท่านั้น (แบบ zoom-pooler) — frontend restart แล้วไม่ block pipeline
wait_rollout "${PROJECT_NAME}" "${PROJECT_NAME}"

log "Deploy สำเร็จ: ${PROJECT_NAME}"
