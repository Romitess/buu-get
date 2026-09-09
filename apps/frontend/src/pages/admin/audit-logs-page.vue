<template>
  <q-page class="page-container audit-logs-page">
    <AppBreadcrumbs />
    <AppPageHeader :title="$t('admin.auditLogs.pageTitle')" />

    <nav class="row q-col-gutter-md q-mb-md items-end">
      <div class="col-12 col-sm-6 col-md-2">
        <q-input
          v-model="filters.from"
          type="date"
          outlined
          dense
          :label="$t('admin.auditLogs.filters.from')"
          clearable
          @update:model-value="onFilterChange"
        />
      </div>
      <div class="col-12 col-sm-6 col-md-2">
        <q-input
          v-model="filters.to"
          type="date"
          outlined
          dense
          :label="$t('admin.auditLogs.filters.to')"
          clearable
          @update:model-value="onFilterChange"
        />
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-select
          v-model="filters.action"
          :options="actionOptions"
          outlined
          dense
          emit-value
          map-options
          clearable
          :label="$t('admin.auditLogs.filters.action')"
          @update:model-value="onFilterChange"
        />
      </div>
      <div class="col-12 col-sm-6 col-md-2">
        <q-select
          v-model="filters.status"
          :options="statusOptions"
          outlined
          dense
          emit-value
          map-options
          clearable
          :label="$t('admin.auditLogs.filters.status')"
          @update:model-value="onFilterChange"
        />
      </div>
      <div class="col-12 col-sm-6 col-md-2">
        <q-input
          v-model="actorUserIdInput"
          type="number"
          outlined
          dense
          :label="$t('admin.auditLogs.filters.actorUserId')"
          clearable
          @update:model-value="onActorIdChange"
        />
      </div>
      <div class="col-12 col-sm-auto col-shrink flex items-end">
        <ExportCsvButton
          :columns="exportColumns"
          :rows="rows"
          :load-rows="loadExportRows"
          file-name-prefix="audit-logs"
          :label="$t('admin.auditLogs.export')"
          dense
          class="audit-export-btn no-wrap"
        />
      </div>
    </nav>

    <BaseTable
      :columns="columns"
      :rows="rows"
      :loading="isLoading"
      :pagination="pagination"
      is-server-side
      :empty-label="$t('admin.auditLogs.noData')"
      @request="onRequest"
    >
      <template v-slot:body-cell-status="{ row }">
        <div class="row justify-center">
          <AuditStatusBadge :status="row.status" />
        </div>
      </template>
      <template v-slot:body-cell-tools="{ row }">
        <div class="row justify-center">
          <ActionButton
            icon="visibility"
            color="primary"
            :tooltip="$t('admin.auditLogs.viewDetail')"
            @click="openDetail(row)"
          />
        </div>
      </template>
    </BaseTable>

    <q-dialog v-model="showDetail">
      <q-card class="audit-detail-dialog">
        <q-card-section class="row items-center q-px-lg q-pt-lg q-pb-md">
          <q-icon name="policy" size="24px" color="primary" class="q-mr-sm" />
          <div class="text-h6 text-weight-bold">{{ $t('admin.auditLogs.detailTitle') }}</div>
          <q-space />
          <q-btn
            v-close-popup
            icon="close"
            flat
            round
            dense
            :aria-label="$t('common.close')"
          />
        </q-card-section>
        <q-separator />

        <q-card-section v-if="selected" class="q-px-lg q-pt-lg q-pb-xl audit-detail-body">
          <dl class="audit-meta-grid">
            <div class="audit-meta-item">
              <dt>{{ $t('admin.auditLogs.columns.createdAt') }}</dt>
              <dd>{{ formatDateTime(selected.createdAt) }}</dd>
            </div>
            <div class="audit-meta-item">
              <dt>{{ $t('admin.auditLogs.columns.status') }}</dt>
              <dd>
                <AuditStatusBadge :status="selected.status" />
              </dd>
            </div>
            <div class="audit-meta-item">
              <dt>{{ $t('admin.auditLogs.columns.action') }}</dt>
              <dd>{{ selected.action }}</dd>
            </div>
            <div class="audit-meta-item">
              <dt>{{ $t('admin.auditLogs.columns.resource') }}</dt>
              <dd>{{ formatResource(selected) }}</dd>
            </div>
            <div class="audit-meta-item">
              <dt>{{ $t('admin.auditLogs.columns.actor') }}</dt>
              <dd>{{ formatActor(selected) }}</dd>
            </div>
            <div class="audit-meta-item">
              <dt>{{ $t('admin.auditLogs.columns.correlationId') }}</dt>
              <dd class="audit-mono">{{ selected.correlationId || '—' }}</dd>
            </div>
            <div v-if="selected.statusDetail" class="audit-meta-item audit-meta-item--full">
              <dt>{{ $t('admin.auditLogs.columns.statusDetail') }}</dt>
              <dd>{{ selected.statusDetail }}</dd>
            </div>
          </dl>

          <div class="audit-state-grid">
            <article class="audit-state-panel">
              <header class="audit-state-header">
                <q-icon name="history" size="18px" class="q-mr-xs" />
                <span>{{ $t('admin.auditLogs.beforeState') }}</span>
              </header>
              <pre
                class="audit-json"
                :class="{ 'audit-json--empty': isEmptySnapshot(selected.beforeState) }"
              >{{ formatJson(selected.beforeState) }}</pre>
            </article>
            <article class="audit-state-panel">
              <header class="audit-state-header audit-state-header--after">
                <q-icon name="update" size="18px" class="q-mr-xs" />
                <span>{{ $t('admin.auditLogs.afterState') }}</span>
              </header>
              <pre
                class="audit-json"
                :class="{ 'audit-json--empty': isEmptySnapshot(selected.afterState) }"
              >{{ formatJson(selected.afterState) }}</pre>
            </article>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { QTableColumn } from 'quasar';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import BaseTable from 'src/components/shared/base-table.vue';
import ActionButton from 'src/components/shared/action-button.vue';
import AuditStatusBadge from 'src/components/shared/audit-status-badge.vue';
import ExportCsvButton from 'src/components/shared/export-csv-button.vue';
import { exportAuditLogs, fetchAuditLogs } from 'src/services/audit-logs.service';
import {
  AUDIT_ACTION_OPTIONS,
  AUDIT_STATUS_OPTIONS,
  type AuditLogListItem,
  type AuditLogStatus,
  type AuditLogsListParams,
} from 'src/types/audit-logs.types';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';

const { t } = useI18n();

const isLoading = ref(false);
const rows = ref<AuditLogListItem[]>([]);
const showDetail = ref(false);
const selected = ref<AuditLogListItem | null>(null);
const actorUserIdInput = ref<string | number | null>(null);
const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const filters = reactive<{
  from: string | null;
  to: string | null;
  action: string | null;
  status: AuditLogStatus | null;
}>({
  from: null,
  to: null,
  action: null,
  status: null,
});

const actionOptions = computed(() =>
  AUDIT_ACTION_OPTIONS.map((value) => ({ label: value, value })),
);

const statusOptions = computed(() =>
  AUDIT_STATUS_OPTIONS.map((value) => ({
    label: t(`admin.auditLogs.status.${value}`),
    value,
  })),
);

const columns = computed<QTableColumn[]>(() => [
  {
    name: 'createdAt',
    label: t('admin.auditLogs.columns.createdAt'),
    field: 'createdAt',
    align: 'center',
    format: (val: string) => formatDateTime(val),
  },
  {
    name: 'action',
    label: t('admin.auditLogs.columns.action'),
    field: 'action',
    align: 'center',
  },
  {
    name: 'actor',
    label: t('admin.auditLogs.columns.actor'),
    field: (row: AuditLogListItem) => formatActor(row),
    align: 'center',
  },
  {
    name: 'resource',
    label: t('admin.auditLogs.columns.resource'),
    field: (row: AuditLogListItem) => formatResource(row),
    align: 'center',
  },
  {
    name: 'status',
    label: t('admin.auditLogs.columns.status'),
    field: 'status',
    align: 'center',
  },
  {
    name: 'ipAddress',
    label: t('admin.auditLogs.columns.ipAddress'),
    field: 'ipAddress',
    align: 'center',
    format: (val: string | null) => val || '—',
  },
  {
    name: 'tools',
    label: t('admin.auditLogs.columns.tools'),
    field: 'id',
    align: 'center',
  },
]);

const exportColumns = computed(() => columns.value.filter((col) => col.name !== 'tools'));

let filterDebounce: ReturnType<typeof setTimeout> | null = null;

const buildParams = (page: number, limit: number): AuditLogsListParams => {
  const params: AuditLogsListParams = { page, limit };
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  if (filters.action) params.action = filters.action;
  if (filters.status) params.status = filters.status;
  const actorId = Number(actorUserIdInput.value);
  if (Number.isInteger(actorId) && actorId > 0) {
    params.actorUserId = actorId;
  }
  return params;
};

const loadData = async (): Promise<void> => {
  isLoading.value = true;
  try {
    const result = await fetchAuditLogs(
      buildParams(pagination.value.page, pagination.value.rowsPerPage),
    );
    rows.value = result.data;
    pagination.value.rowsNumber = result.meta.total;
  } catch (error) {
    console.error('Failed to load audit logs:', error);
    rows.value = [];
    pagination.value.rowsNumber = 0;
  } finally {
    isLoading.value = false;
  }
};

const loadExportRows = async (): Promise<AuditLogListItem[]> => {
  return exportAuditLogs(buildParams(1, 5000));
};

const onRequest = (props: TableRequestProps): void => {
  pagination.value.page = props.pagination.page;
  pagination.value.rowsPerPage = props.pagination.rowsPerPage;
  void loadData();
};

const onFilterChange = (): void => {
  if (filterDebounce) clearTimeout(filterDebounce);
  filterDebounce = setTimeout(() => {
    pagination.value.page = 1;
    void loadData();
  }, 250);
};

const onActorIdChange = (): void => {
  onFilterChange();
};

const openDetail = (row: AuditLogListItem): void => {
  selected.value = row;
  showDetail.value = true;
};

const formatActor = (row: AuditLogListItem): string => {
  const email = row.actorSnapshot?.email;
  if (email) return email;
  return t('admin.auditLogs.systemActor');
};

const formatResource = (row: AuditLogListItem): string => {
  if (!row.resourceType && !row.resourceId) return '—';
  if (row.resourceType && row.resourceId) {
    return `${row.resourceType}:${row.resourceId}`;
  }
  return row.resourceType || row.resourceId || '—';
};

const formatDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('th-TH', { hour12: false });
};

const isEmptySnapshot = (value: Record<string, unknown> | null): boolean => {
  return !value || Object.keys(value).length === 0;
};

const formatJson = (value: Record<string, unknown> | null): string => {
  if (isEmptySnapshot(value)) {
    return t('admin.auditLogs.emptyState');
  }
  return JSON.stringify(value, null, 2);
};

onMounted(() => {
  void loadData();
});
</script>

<style scoped lang="scss">
.audit-export-btn {
  :deep(.q-btn) {
    height: 40px;
    min-height: 40px;
    padding: 0 16px;
  }
}

.audit-detail-dialog {
  width: min(920px, 95vw);
  border-radius: 16px;
}

.audit-detail-body {
  max-height: 75vh;
  overflow-y: auto;
}

.audit-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: 1fr;
  gap: 16px 24px;
  margin: 0 0 24px;
}

.audit-meta-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 56px;
  margin: 0;
  padding: 12px 14px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--surface-page);

  dt {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.25;
    color: var(--text-secondary);
  }

  dd {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.4;
    color: var(--text-primary);
    word-break: break-word;
  }
}

.audit-meta-item--full {
  grid-column: 1 / -1;
}

.audit-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8rem;
  font-weight: 500;
  word-break: break-all;
}

.audit-state-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: stretch;
}

.audit-state-panel {
  display: flex;
  flex-direction: column;
  height: 320px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  background: var(--surface-card);
}

.audit-state-header {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 0 14px;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary);
  background: var(--surface-page);
  border-bottom: 1px solid var(--border-color);
}

.audit-state-header--after {
  color: var(--primary);
  background: rgba(13, 71, 161, 0.06);
}

.audit-json {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 14px;
  overflow: auto;
  background: var(--surface-card);
  font-size: 12px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}

.audit-json--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  white-space: normal;
}

@media (max-width: 599px) {
  .audit-meta-grid,
  .audit-state-grid {
    grid-template-columns: 1fr;
  }
}
</style>
