# Spec: Tag-driven GitLab CI/CD (build + deploy by git tag)

Adoption spec for campus Quasar + NestJS (or similar) monorepos that currently trigger pipelines on branch push / merge. This project’s reference implementation is [`.gitlab-ci.yml`](../.gitlab-ci.yml).

Not `apps/backend` + `apps/frontend`? Use [ci-tag-driven-deploy-non-monorepo-spec.md](./ci-tag-driven-deploy-non-monorepo-spec.md). Do not fork the tag/env/Vault contracts below.

Copy the contracts below, not the whole file. Vault paths, Helm helpers, and ResourceQuota work stay project-specific.

---

## 1. Trigger contract

| Tag | Env | Pipeline |
| --- | --- | --- |
| `v1.2.0-dev` | develop → **dev** | Created |
| `v1.2.0-test` | test → **test** | Created |
| `v1.2.0` | main → **prod** | Created |
| Branch push / merge request | — | None |
| Other suffixes (`v1.2.0-rc.1`, `v1.2.0-staging`, `v1.2.0-dev.1`) | — | None |
| Legacy / non-semver (`DCV`, `latest`, `1.0.0`) | — | None |

Workflow rules:

```yaml
workflow:
  rules:
    - if: $CI_COMMIT_TAG =~ /^v\d+\.\d+\.\d+(-dev|-test)?$/
    - when: never
```

Tag type: **lightweight only**. The suffix **is** the environment. Ancestry is still checked (section 2).

| Tag | Image tag | Displayed version (`APP_VERSION`) |
| --- | --- | --- |
| `v1.2.0-dev` | `api:v1.2.0-dev` | `v1.2.0` |
| `v1.2.0-test` | `api:v1.2.0-test` | `v1.2.0` |
| `v1.2.0` | `api:v1.2.0` (+ `:latest`) | `v1.2.0` |

### Operator commands

```bash
# Dev
git checkout develop && git pull
git tag v1.2.0-dev && git push origin v1.2.0-dev

# Test (after merge develop → test)
git checkout test && git pull
git tag v1.2.0-test && git push origin v1.2.0-test

# Prod (after merge test → main)
git checkout main && git pull
git tag v1.2.0 && git push origin v1.2.0
```

Do **not** `git push origin develop` expecting a deploy. Promotion is a **new tag per environment**, not a re-run of the same tag.

### Legacy tags

Leave historical tags (`DCV`, unsuffixed tags already pushed to develop) in the repo. They must not match the new regex unless they are a plain `vX.Y.Z` intended for **prod**. Do not reuse a plain `vX.Y.Z` on `develop`.

---

## 2. Environment resolution

Job: `resolve-deploy-target` (stage `prepare`). Image: `alpine/git`. `GIT_DEPTH: "0"`.

`alpine/git` requires `entrypoint: [""]`; without it the job fails with `git: 'sh' is not a git command`.
`anchore/syft` (non-`-debug`) is scratch: binary `/syft`, no shell. GitLab Docker executor always execs `sh` for `script:`. `entrypoint: [""]` does not add a shell — use `anchore/syft:<ver>-debug` and invoke `/syft`.

### Algorithm

1. Map suffix → env / branch / trimmed version:

   | Tag pattern | `DEPLOY_ENV` | Fetch | `APP_VERSION` |
   | --- | --- | --- | --- |
   | `*-dev` | `dev` | `origin/develop` | strip `-dev` |
   | `*-test` | `test` | `origin/test` | strip `-test` |
   | otherwise (`vX.Y.Z`) | `prod` | `origin/main` | unchanged |

   `DEPLOY_NAMESPACE=$DEPLOY_ENV`. `IMAGE_TAG=$CI_COMMIT_TAG` (full).

2. Fetch **only that one branch**. `git merge-base --is-ancestor $CI_COMMIT_SHA origin/<branch>` must succeed; otherwise `exit 1` (`tag … targets <env> but commit is not on <branch>`). Downstream jobs never run.

3. Write dotenv `deploy-target.env`:

```
DEPLOY_ENV=dev|test|prod
IMAGE_TAG=vX.Y.Z[-dev|-test]
DEPLOY_NAMESPACE=dev|test|prod
APP_VERSION=vX.Y.Z
```

GitLab dotenv injects these into later jobs (`docker-build*`, `image-scan*`, `require_deploy_target`). `rules:` cannot read dotenv — deploy jobs select themselves with a `$CI_COMMIT_TAG` suffix regex at pipeline creation (section 4).

### Promotion (new tag per environment)

| Step | Action | Tag | Deploy job |
| --- | --- | --- | --- |
| 1 | On `develop` | `v1.2.0-dev` | `deploy-dev` (auto) + `deploy-dev-manual` (Play bypass) |
| 2 | Merge `develop` → `test` | — | — |
| 3 | On `test` | `v1.2.0-test` | `deploy-test` (manual) |
| 4 | Merge `test` → `main` | — | — |
| 5 | On `main` | `v1.2.0` | `deploy-prod` (manual) |

Re-running `v1.2.0-dev` after it is also on `test` still deploys **dev** (suffix wins). To promote, mint the next suffix.

### Hotfix

Tag the hotfix commit on `main` as plain `vX.Y.Z` and push. Ancestry must hit `origin/main`. Image is `:vX.Y.Z`. No `-dev`/`-test` hop unless you also tag those branches.

### Local check (before pushing a tag)

```bash
TAG=v1.2.0-dev   # or v1.2.0-test / v1.2.0
SHA=$(git rev-parse HEAD)
case "$TAG" in
  *-dev)  b=develop ;;
  *-test) b=test ;;
  *)      b=main ;;
esac
git merge-base --is-ancestor "$SHA" "origin/$b" && echo "OK $TAG on $b" || echo "FAIL $TAG not on $b"
```

---

## 3. Image naming contract

| Image | Tag | When |
| --- | --- | --- |
| `${CI_REGISTRY_IMAGE}/api` | full `$CI_COMMIT_TAG` (`v1.2.0-dev` / `-test` / `v1.2.0`) | Always |
| `${CI_REGISTRY_IMAGE}/web` | same | Always |
| same repos | `latest` | **Only** when `DEPLOY_ENV=prod` (plain `vX.Y.Z`) |
| same repos | `buildcache` | Always (layer cache for `--cache-from`; push failure is a WARN only). Not deployed. |
| displayed version | trimmed `APP_VERSION` (`v1.2.0`) | Footer + `GET /api/health` |
| `:CI_COMMIT_SHORT_SHA` / `:CI_COMMIT_REF_SLUG` | — | **Removed.** Do not restore. |

Helm `--set image.tag` / `web.image.tag` and the migrate Job use **full** `$CI_COMMIT_TAG`. k3s pulls `…/api:v1.2.0-dev` on develop, `…:v1.2.0` on prod.

Build-args: `APP_VERSION` / `VITE_APP_VERSION` = dotenv `APP_VERSION` (suffix stripped). Do **not** pass `$CI_COMMIT_TAG` into those args.

Same version number can exist as three registry tags (`v1.2.0-dev`, `v1.2.0-test`, `v1.2.0`); they do not overwrite each other.

### Build skip

Every image is built with `--label org.opencontainers.image.revision=$CI_COMMIT_SHA`. `build_and_push_app_image` runs `docker pull "${IMAGE}:${CI_COMMIT_TAG}"`:

- Pull succeeds and the revision label equals `$CI_COMMIT_SHA` → skip build and push.
- Pull succeeds but the label differs (or is missing) → rebuild and push over the same tag.
- Pull fails → build and push.

Builds use `--cache-from ${IMAGE}:buildcache` (with `BUILDKIT_INLINE_CACHE=1`). If the cached build fails, CI retries once without `--cache-from`. After every build or skip, CI re-tags and pushes `:buildcache`. Prod then `docker pull` → tag → push `:latest`.

Old SHA tags stay until registry cleanup.

---

## 4. Deploy contract (single pipeline)

GitLab evaluates `rules:` when a pipeline is **created**. Dotenv from `resolve-deploy-target` is too late for `rules:`. With the suffixed tag contract the environment is known from `$CI_COMMIT_TAG` at creation time, so each deploy job selects itself with a tag regex. Do **not** use `if: $DEPLOY_ENV` in `rules:`.

On `-dev` two jobs are created (auto gated by scan + manual bypass). Both have `allow_failure: true`, so a blocked auto deploy or an un-clicked Play does not fail or block the pipeline. On `-test` / plain `vX.Y.Z` only the matching manual job is created — no scan bypass.

| Job | When it exists | When it runs | GitLab environment |
| --- | --- | --- | --- |
| `deploy-dev` | `$CI_COMMIT_TAG` matches `^v\d+\.\d+\.\d+-dev$` | auto, after both image scans; `exit 1` unless both `scan-status-*.txt` are `PASSED` (missing file counts as `MISSING`); job-level `allow_failure: true` | `dev` (`$APP_URL_DEV`) |
| `deploy-dev-manual` | same `-dev` regex | manual Play (`allow_failure: true`); `needs` `resolve-deploy-target`, `docker-build`, `docker-build-web`, `db-migrate-verify`; **no** scan | `dev` (`$APP_URL_DEV`) |
| `deploy-test` | `$CI_COMMIT_TAG` matches `^v\d+\.\d+\.\d+-test$` | manual Play, after both image scans (scan fail skips this job) | `test` (`$APP_URL_TEST`) |
| `deploy-prod` | `$CI_COMMIT_TAG` matches `^v\d+\.\d+\.\d+$` | manual Play, after both image scans (scan fail skips this job) | `prod` (no URL) |

```yaml
.deploy_job:
  extends: .helm_deploy
  stage: deploy
  needs:
    - job: resolve-deploy-target
    - job: image-scan
      artifacts: false
    - job: image-scan-web
      artifacts: false

deploy-dev:
  extends: .deploy_job
  needs:            # artifacts default true → scan-status-*.txt available
    - job: resolve-deploy-target
    - job: image-scan
    - job: image-scan-web
  rules:
    - if: $CI_COMMIT_TAG =~ /^v\d+\.\d+\.\d+-dev$/
  allow_failure: true

deploy-dev-manual:
  extends: .helm_deploy
  stage: deploy
  needs:
    - job: resolve-deploy-target
    - job: docker-build
      artifacts: false
    - job: docker-build-web
      artifacts: false
    - job: db-migrate-verify
      artifacts: false
  rules:
    - if: $CI_COMMIT_TAG =~ /^v\d+\.\d+\.\d+-dev$/
      when: manual
      allow_failure: true

deploy-test:
  extends: .deploy_job
  rules:
    - if: $CI_COMMIT_TAG =~ /^v\d+\.\d+\.\d+-test$/
      when: manual

deploy-prod:
  extends: .deploy_job
  rules:
    - if: $CI_COMMIT_TAG =~ /^v\d+\.\d+\.\d+$/
      when: manual
```

Do **not** use `if: $DEPLOY_ENV` in `rules:` — that variable is dotenv and is empty at pipeline creation, so deploy jobs would be hidden. Do **not** `needs: [build]` (that is a job name, not a stage). `deploy-dev-manual` must `extends: .helm_deploy` (helpers only) — do not extend `.deploy_job`, which `needs` scan.

Every deploy job calls `deploy_release <env> <mode>`, in this order: `require_deploy_target`, Vault fetch, kubeconfig (fail closed), namespace, `regcred`, `${RELEASE_NAME}-env` Secret from sanitized dotenv, the migrate Job (`migration:run`), and finally `helm upgrade --install --wait --timeout 8m`. Ingress hosts are `${RELEASE_NAME}-dev.buu.ac.th`, `${RELEASE_NAME}-test.buu.ac.th`, and `${RELEASE_NAME}.buu.ac.th`. If the Helm `--wait` fails, or the current API ReplicaSet hits CrashLoop/ImagePull twice in a row, CI dumps logs and runs `helm rollback --timeout 3m` without `--wait`. It skips the rollback if the current API ReplicaSet is already Ready.

Jobs live in [`.gitlab/ci/deploy.yml`](../.gitlab/ci/deploy.yml) (Helm helpers + deploy jobs), included from the parent `.gitlab-ci.yml`. Vault functions live in [`.gitlab/ci/vault-helpers.yml`](../.gitlab/ci/vault-helpers.yml) and are pulled in with `!reference` (anchors do not cross files). Because the jobs are in the same pipeline as prepare/scan, they can `needs:` those jobs directly. This is **not** a child pipeline.

Helper `require_deploy_target <expected-env> <mode>` in `.helm_deploy` still runs **before** Vault / kubeconfig (defence in depth), except `deploy-dev` first checks scan-status files:

1. `$CI_COMMIT_TAG` must match `^v[0-9]+\.[0-9]+\.[0-9]+(-dev|-test)?$` else `exit 1`.
2. `$DEPLOY_ENV` must be set else `exit 1`.
3. `$DEPLOY_ENV` must equal `<expected-env>` (`skip` / `fail` as before). With tag-regex `rules:` the mismatch path should not appear in the UI.

Helm / migrate always use `$CI_COMMIT_TAG`.

---

## 5. Pipeline stages and jobs

```
prepare → quality → build → image-scan → deploy → dast → perf
```

`docker-build` / `docker-build-web` have **no** `needs`, so they wait for the whole `quality` stage (blocking Sonar jobs). They use `dependencies: [resolve-deploy-target]` to receive the dotenv (`APP_VERSION`, `DEPLOY_ENV`) without skipping stage order. Do not turn that into `needs: [resolve-deploy-target]`: GitLab `needs` would let the image build start before quality finishes.

| Job | Stage | Rule | Needs | Blocking |
| --- | --- | --- | --- | --- |
| `resolve-deploy-target` | prepare | `$CI_COMMIT_TAG` | — | yes (wrong suffix/branch fails pipeline) |
| `sonar-scan-api` / `-web` | quality | `$CI_COMMIT_TAG` | — | yes (`allow_failure: false`) |
| `sonar-scan-quality-gate-api` / `-web` | quality | `$CI_COMMIT_TAG` | matching scan | yes (job fails on missing Sonar secrets; QG ERROR is currently logged, not `exit 1`) |
| `unit-test-api` / `-web` | quality | `$CI_COMMIT_TAG` | — | no |
| `dependency-check-api` / `-web` | quality | `$CI_COMMIT_TAG` | — | no |
| `sbom-generate-api` / `-web` | quality | `$CI_COMMIT_TAG` | — | no |
| `docker-build` / `docker-build-web` | build | `$CI_COMMIT_TAG` | — (stage order; `dependencies: [resolve-deploy-target]`) | yes |
| `db-migrate-verify` | build | `$CI_COMMIT_TAG` | `docker-build` | yes, `migration:show` only, against a throwaway `mysql:8.4`. The empty-DB `migration:run` is **skipped** because `EX_T_SESSIONS` and `EXAM_T_SESSIONS` clash on a fresh DB. The real `migration:run` happens in the deploy migrate Job. |
| `image-scan` / `image-scan-web` | image-scan | `$CI_COMMIT_TAG` suffix regex | matching docker-build + `resolve-deploy-target` | Trivy writes a JSON report with HIGH,CRITICAL findings (`--exit-code 0`), then runs a strict CRITICAL check (`--exit-code 1`) on every tag. It writes `scan-status-api.txt` / `scan-status-web.txt` (`PASSED`/`FAILED`) **before** `exit 1`; `artifacts: when: always`. `allow_failure` comes from `$CI_COMMIT_TAG` in `rules:`: `*-dev` → `true`; `*-test` and `vX.Y.Z` → `false`. Do not key this off `$DEPLOY_ENV`. |
| `deploy-dev` | deploy | `$CI_COMMIT_TAG` `…-dev$` auto, `allow_failure: true` | resolve + both scans (artifacts) | logs status and runs `exit 1` unless both status files are `PASSED`; the pipeline still passes, with a warning |
| `deploy-dev-manual` | deploy | `$CI_COMMIT_TAG` `…-dev$` manual (`allow_failure: true`) | `resolve-deploy-target`, `docker-build`, `docker-build-web`, `db-migrate-verify` (not scan, not `[build]`) | Play deploys even if scan failed; does not block the pipeline |
| `deploy-test` | deploy | `$CI_COMMIT_TAG` `…-test$` manual | resolve + both scans | yes; scan fail skips job (no bypass) |
| `deploy-prod` | deploy | `$CI_COMMIT_TAG` `^v\d+\.\d+\.\d+$` manual | resolve + both scans | yes; scan fail skips job (no bypass) |
| `dast` / `perf-test` | dast / perf | manual, `allow_failure: true` (no tag rule; target `$APP_URL_TEST`) | — | no |

---

## 6. GitLab + Vault (unchanged names)

Keep existing CI/CD variable **names**. Tag pipelines must actually receive them.

| Variable / secret | Role |
| --- | --- |
| `VAULT_TOKEN`, `VAULT_SERVERS` / `VAULT_ADDR` | Vault HA |
| `VAULT_PROJECT_NAME`, `VAULT_EXTRA_PROJECT_NAMES` | KV path slug override |
| Vault `secret/data/SONAR-CI` | `SONAR_URL`, `SONAR_TOKEN-CI` |
| Vault `secret/data/KUBECONFIG` | shared kubeconfig / `REGISTRY_HOST` |
| Vault `secret/data/<slug>/{dev,test,prod}` | `KUBECONFIG_*`, `DOTENV_*`, registry user/token |
| GitLab fallbacks | `KUBECONFIG_DEV/_TEST/_PROD`, `SONAR_HOST_URL`, `SONAR_TOKEN`, `DOTENV_*` |
| `CI_REGISTRY_USER` / `CI_REGISTRY_PASSWORD` | docker push (or Vault `REGISTRY_USER` / `REGISTRY_TOKEN`) |

### Protected tags (required ops change)

Because **only tags** run the pipeline:

1. Protect tag pattern `v*` (or `v*.*.*`) so only maintainers can create/push tags.
2. Mark `VAULT_TOKEN` (and kubeconfig file vars) as **Protected**. They are then injected only on protected tags — not on stray unprotected tags (which this workflow already ignores).
3. Protecting `develop` is no longer required for CI injection (branch pipelines do not run). Still protect `main` / `test` / `develop` against force-push.

Runner: tag `gitrunner` (or project `RUNNER_TAG`). Job token must `git fetch` the **one** branch implied by the tag suffix (`GIT_DEPTH: 0`).

---

## 7. Migration checklist (branch-triggered → tag-driven)

Use this on another project that still keys jobs off `$CI_COMMIT_BRANCH`.

1. **Inventory** every `rules:` / `only:` that mentions `develop`, `test`, `main`, or merge-request pipelines. Note which deploy job is auto vs manual.
2. **Replace `workflow.rules`** with the tag regex + `when: never` (section 1). Confirm MR pipelines disappear.
3. **Add stage `prepare` first** and copy `resolve-deploy-target` (suffix → env; fetch **one** branch; ancestry check). Emit `APP_VERSION` (trimmed) in dotenv. Rename `main` if the prod branch is `master`.
4. **Switch every parent job `rules`** from `$CI_COMMIT_BRANCH == …` to `$CI_COMMIT_TAG`.
5. **Split deploy YAML:** `.gitlab/ci/vault-helpers.yml` (Vault functions as a hidden job) and `.gitlab/ci/deploy.yml` (`.helm_deploy` + deploy jobs). Parent `include:`s both. Use `!reference` instead of YAML anchors across files. Do **not** declare `stages:` in `deploy.yml` (it would override the parent list). Do **not** use a child pipeline.
6. **Deploy job `rules`** on `$CI_COMMIT_TAG` suffix regex (`-dev` auto + `-dev` manual bypass, `-test` / plain `when: manual`). `deploy-dev` `needs` resolve + both scans with artifacts, has `allow_failure: true`, and runs `exit 1` unless the status files are `PASSED`. `deploy-dev-manual` `needs` `resolve-deploy-target`, `docker-build`, `docker-build-web`, `db-migrate-verify` (`allow_failure: true`) — never `needs: [build]` and never scan. `deploy-test` / `deploy-prod` keep `needs` both scans (no bypass). Do **not** use `if: $DEPLOY_ENV` in `rules:` (dotenv is empty at creation).
7. **Image tag = full `$CI_COMMIT_TAG`** (`vX.Y.Z-dev` / `-test` / plain). **Display version = trimmed `APP_VERSION`** in Docker build-args. Push `:latest` only for prod. Skip the build when the pulled image's `org.opencontainers.image.revision` label equals `$CI_COMMIT_SHA`. Use `:buildcache` for layer cache. Helm / migrate use the full tag.
8. **Keep `require_deploy_target`** as a deploy `script` line (`dev skip` / `test fail` / `prod fail`). On `deploy-dev` it runs **after** the scan-status check. Fail closed if `CI_COMMIT_TAG` or `DEPLOY_ENV` is empty.
9. **Trivy (or equivalent):** `CRITICAL --exit-code 1` on **every** tag. Write `PASSED`/`FAILED` to `scan-status-api.txt` / `scan-status-web.txt` before `exit 1`. `artifacts: when: always`. `allow_failure` from `$CI_COMMIT_TAG` in `rules:` (`*-dev` true; `*-test` and `vX.Y.Z` false) — not from `$DEPLOY_ENV`.
10. **GitLab UI:** protect `v*`; Protected variables on protected tags; document “new tag per env after merge” (`-dev` → `-test` → plain).
11. **Do not** keep a branch pipeline “just for tests” unless product explicitly wants it — this spec is tag-only.
12. **Smoke:** `vX.Y.Z-dev` on develop → `deploy-dev` (auto) **and** `deploy-dev-manual` (Play) in stage deploy; footer `vX.Y.Z`. Scan fail → auto logs status and runs `exit 1` (warning only), and Play still deploys. `vX.Y.Z-test` on test → only `deploy-test` (scan fail blocks, no bypass). `vX.Y.Z` on main → only `deploy-prod` (same). `vX.Y.Z-dev` on a non-develop commit → prepare fails. `DCV` / `v1.2.0-rc.1` → no pipeline.

Rollback of the YAML itself: restore the previous `.gitlab-ci.yml`. Cluster rollback: re-run the previous good tag pipeline, or `helm rollback <release> -n <ns> --timeout 5m` (do **not** pass `--wait`).

---

## 8. Rollback of a release

1. Preferred: GitLab → Run pipeline on the **previous tag for that env** (`vX.Y.Z-dev` / `-test` / plain).
2. Fallback: `helm rollback <release> -n <dev|test|prod> --timeout 5m` (**no `--wait`**). A crashlooping API makes `--wait` fail with `context deadline exceeded`. Then confirm Deployment image tag.
3. If `deploy/<release>` is missing after `UPGRADE FAILED: deployments.apps "<release>" not found`, restore the object **before** another `deploy-prod` click (prod migrate no longer scales replicas to 0, but a missing Deployment still needs a manifest apply):

   ```bash
   helm history <release> -n prod
   helm status <release> -n prod
   helm get manifest <release> -n prod | kubectl apply -n prod -f -
   kubectl get deploy,po -n prod -l "app in (<release>,<release>-web)"
   kubectl logs -n prod -l app=<release> --previous --tail=200
   ```

   Connection refused on `/api/health` means Nest never listened. Look for `Production trust readiness failed:`. Prod dotenv must set `CORS_ORIGINS` (not only `CORS_ORIGIN`) and `FRONTEND_PUBLIC_URL` as https origin-only. Do not disable TrustReadiness. Do not change the probe path.
   CI dumps API logs when the **current** API ReplicaSet is CrashLoop/ImagePull twice in a row (ignores leftover pods from older tags). Startup probe `connection refused` during Nest listen is not CrashLoop. If that current ReplicaSet is already Ready, CI does **not** Helm-rollback. `privacy_notice` still needs at least one active row in prod — that cannot be checked from dotenv.
4. Do not retag an existing name; cut `vX.Y.(Z+1)[-dev|-test]`.

---

## 9. Risks other projects should copy verbatim

- Suffix decides env; ancestry must still match (`-dev` on a commit not on `develop` fails prepare). Re-running `-dev` never becomes test/prod.
- Image tag is the **full** git tag; displayed version is **trimmed**. Do not pass `$CI_COMMIT_TAG` into `APP_VERSION` / `VITE_APP_VERSION`.
- `needs:` on `docker-build` would skip the quality stage; do not add it.
- Other suffixes (`-rc.1`, `-staging`) do not match the workflow regex.
- `rules:` cannot read dotenv from a previous job. Select the deploy job with `$CI_COMMIT_TAG` suffix regex, not `if: $DEPLOY_ENV`.
- Trivy `allow_failure` belongs in `rules:` on `$CI_COMMIT_TAG` (`*-dev` true; `*-test` / `vX.Y.Z` false). Do not branch `--exit-code 1` on `$DEPLOY_ENV`.
- `deploy-dev-manual` must not `needs` scan jobs and must not `needs: [build]`. It is `when: manual` + `allow_failure: true`, so the pipeline finishes without anyone pressing Play. `deploy-dev` is also `allow_failure: true`, so a scan-blocked auto deploy shows as a warning, not a failed pipeline.
- `db-migrate-verify` only proves `migration:show` works against the built image. Migrations are first actually executed by the deploy migrate Job, so a broken migration surfaces at deploy time, and the Helm upgrade is skipped.
- YAML anchors (`&foo` / `*foo`) do not cross `include:` files. Use `!reference`.
- `alpine/git` requires `entrypoint: [""]`; without it the job fails with `git: 'sh' is not a git command`.
- `anchore/syft` (non-`-debug`) is scratch: binary `/syft`, no shell. GitLab Docker executor always execs `sh` for `script:`. `entrypoint: [""]` does not add a shell — use `anchore/syft:<ver>-debug` and invoke `/syft`.

---

## 10. Post-merge acceptance (this repo)

Cannot be proven in a local sandbox. After this YAML is on the default integration branch:

1. Push `vX.Y.Z-dev` on `develop` → `DEPLOY_ENV=dev`; `deploy-dev` (auto) and `deploy-dev-manual` (Play) appear in stage deploy; k3s images `:vX.Y.Z-dev`; footer / `/api/health` show `vX.Y.Z`. If scan is not `PASSED`, auto `exit 1` (shown as a warning; the pipeline still passes) but Play still deploys.
2. Push to `develop` without a tag → **no** pipeline.
3. After merge to `test`, push `vX.Y.Z-test` → only `deploy-test` appears in stage deploy; image `:vX.Y.Z-test`; footer still `vX.Y.Z`. Scan fail skips deploy (no bypass).
4. After merge to `main`, push `vX.Y.Z` → only `deploy-prod` appears in stage deploy; image `:vX.Y.Z` + `:latest`. Scan fail skips deploy (no bypass).
5. `vX.Y.Z-dev` on a commit not on `develop` → prepare fails. `DCV` / `v1.2.0-rc.1` → no pipeline.
