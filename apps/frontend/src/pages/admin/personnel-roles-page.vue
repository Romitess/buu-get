<template>
  <q-page class="page-container personnel-roles-page">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('admin.personnelRoles.pageTitle')"
      :subtitle="$t('admin.personnelRoles.pageSubtitle')"
    />

    <nav class="row q-col-gutter-md q-mb-md items-end">
      <div class="col-12 col-sm-6 col-md-5">
        <SearchBar
          v-model="searchQuery"
          :placeholder="$t('admin.personnelRoles.searchPlaceholder')"
        />
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <AppSelect
          v-model="roleFilter"
          :options="roleFilterOptions"
          outlined
          dense
          emit-value
          map-options
          clearable
          dropdown-icon="keyboard_arrow_down"
          class="custom-input"
          :label="$t('admin.personnelRoles.filters.role')"
          @update:model-value="onRoleFilterChange"
        />
      </div>
    </nav>

    <BaseTable
      :columns="columns"
      :rows="rows"
      :loading="isLoading"
      :pagination="pagination"
      is-server-side
      :empty-label="$t('admin.personnelRoles.noData')"
      @request="onRequest"
    >
      <template #body-cell-fullName="{ row }">
        <div class="text-left cell-inner-padding">{{ formatFullName(row) }}</div>
      </template>
      <template #body-cell-roles="{ row }">
        <div class="row q-gutter-xs justify-center flex-wrap items-center">
          <AppStatusBadge
            v-for="role in row.ROLES ?? []"
            :key="role.ROLE_ID"
            :label="roleLabel(role.ROLE_NAME)"
            :type="roleBadgeType(role.ROLE_NAME)"
            :dot="false"
          />
          <span v-if="!(row.ROLES && row.ROLES.length)" class="text-grey-6">—</span>
        </div>
      </template>
      <template #body-cell-retire="{ row }">
        <div class="row justify-center">
          <AppStatusBadge
            :label="
              row.PSN_RETIRE === 'Y'
                ? $t('admin.personnelRoles.status.retired')
                : $t('admin.personnelRoles.status.active')
            "
            :type="row.PSN_RETIRE === 'Y' ? 'info' : 'success'"
          />
        </div>
      </template>
      <template #body-cell-tools="{ row }">
        <div class="row justify-center">
          <ActionButton
            icon="edit"
            color="primary"
            :tooltip="$t('admin.personnelRoles.editRoles')"
            @click="openEditDialog(row)"
          />
        </div>
      </template>
    </BaseTable>

    <q-dialog
      v-model="showEditDialog"
      persistent
      transition-show="scale"
      transition-hide="scale"
    >
      <q-card class="roles-dialog-card">
        <q-card-section class="roles-dialog-header row items-start no-wrap">
          <div class="roles-dialog-header__icon row flex-center">
            <q-icon name="badge" size="22px" color="primary" />
          </div>
          <div class="col q-ml-md">
            <div class="roles-dialog-title">
              {{ $t('admin.personnelRoles.editDialog.title') }}
            </div>
            <div class="roles-dialog-subtitle">
              {{ $t('admin.personnelRoles.editDialog.subtitle') }}
            </div>
          </div>
          <q-btn
            flat
            round
            dense
            icon="close"
            color="grey-6"
            :aria-label="$t('common.close')"
            @click="closeEditDialog"
          />
        </q-card-section>

        <q-separator />

        <q-card-section class="roles-dialog-body">
          <div v-if="editingPerson" class="person-card row items-center no-wrap q-mb-lg">
            <q-avatar size="48px" color="primary" text-color="white" class="person-card__avatar">
              {{ personInitials(editingPerson) }}
            </q-avatar>
            <div class="col q-ml-md overflow-hidden">
              <div class="person-card__name ellipsis">{{ formatFullName(editingPerson) }}</div>
              <div class="person-card__meta row items-center q-gutter-x-sm text-grey-7">
                <span class="ellipsis">{{ editingPerson.PSN_ID }}</span>
                <span v-if="editingPerson.PSN_USERNAME" class="person-card__dot">·</span>
                <span v-if="editingPerson.PSN_USERNAME" class="ellipsis">
                  {{ editingPerson.PSN_USERNAME }}
                </span>
              </div>
              <div v-if="editingPerson.PSN_EMAIL_BUU" class="person-card__email ellipsis text-grey-7">
                {{ editingPerson.PSN_EMAIL_BUU }}
              </div>
            </div>
            <AppStatusBadge
              class="q-ml-sm"
              :label="
                editingPerson.PSN_RETIRE === 'Y'
                  ? $t('admin.personnelRoles.status.retired')
                  : $t('admin.personnelRoles.status.active')
              "
              :type="editingPerson.PSN_RETIRE === 'Y' ? 'info' : 'success'"
            />
          </div>

          <div class="roles-section-header row items-center justify-between q-mb-sm">
            <div class="roles-section-title">
              {{ $t('admin.personnelRoles.editDialog.rolesLabel') }}
            </div>
            <q-badge rounded color="grey-3" text-color="grey-9" class="roles-count-badge">
              {{ selectedRoleIds.length }}
              {{ $t('admin.personnelRoles.editDialog.selectedCount') }}
            </q-badge>
          </div>
          <div class="roles-section-hint text-grey-7 q-mb-md">
            {{ $t('admin.personnelRoles.editDialog.rolesHint') }}
          </div>

          <div class="role-option-grid">
            <button
              v-for="option in assignableRoleOptions"
              :key="option.value"
              type="button"
              class="role-option"
              :class="{ 'role-option--selected': isRoleSelected(option.value) }"
              @click="toggleRole(option.value)"
            >
              <div class="role-option__check row flex-center">
                <q-icon
                  :name="isRoleSelected(option.value) ? 'check_circle' : 'radio_button_unchecked'"
                  size="20px"
                />
              </div>
              <div class="role-option__label">{{ option.label }}</div>
            </button>
          </div>

          <div v-if="roleSelectError" class="roles-error row items-center q-mt-sm">
            <q-icon name="error" size="16px" class="q-mr-xs" />
            {{ roleSelectError }}
          </div>

          <div
            v-if="protectedRoleLabels.length"
            class="protected-roles-note q-mt-md"
          >
            <q-icon name="lock" size="16px" class="q-mr-xs" />
            {{ $t('admin.personnelRoles.editDialog.protectedHint') }}:
            <strong>{{ protectedRoleLabels.join(', ') }}</strong>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="roles-dialog-actions q-gutter-sm">
          <AppButton
            :label="$t('common.cancel')"
            class="dialog-footer-btn cancel-btn"
            :disable="isSaving"
            @click="closeEditDialog"
          />
          <AppButton
            :label="$t('admin.personnelRoles.editDialog.save')"
            color="primary"
            class="dialog-footer-btn"
            :loading="isSaving"
            @click="saveRoles"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar, type QTableColumn } from 'quasar';
import AppButton from 'src/components/base/app-button.vue';
import AppSelect from 'src/components/base/app-select.vue';
import AppStatusBadge from 'src/components/base/app-status-badge.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import BaseTable from 'src/components/shared/base-table.vue';
import ActionButton from 'src/components/shared/action-button.vue';
import { getRoleRank, maxRoleRank, ROLES } from 'src/constants/roles';
import {
  fetchMsgPersons,
  fetchSystemRoles,
  updateMsgPersonRoles,
} from 'src/services/msg-persons.service';
import { useUserStore } from 'src/stores/user.store';
import type { MsgPerson, SystemRole } from 'src/types/msg-person';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';

/** บทบาทที่ห้ามเลือกใน dialog แก้ไข (ยังแสดงในตารางได้) */
const NON_ASSIGNABLE_ROLE_NAMES = new Set<string>([
  ROLES.PROCTOR,
  ROLES.CANDIDATE,
]);

const $q = useQuasar();
const { t, locale } = useI18n();
const userStore = useUserStore();

const isLoading = ref(false);
const isSaving = ref(false);
const searchQuery = ref('');
const roleFilter = ref<string | null>(null);
const rows = ref<MsgPerson[]>([]);
const systemRoles = ref<SystemRole[]>([]);
const showEditDialog = ref(false);
const editingPerson = ref<MsgPerson | null>(null);
const selectedRoleIds = ref<number[]>([]);
const protectedRoleIds = ref<number[]>([]);
const roleSelectError = ref('');

const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

let searchDebounce: ReturnType<typeof setTimeout> | null = null;

const actorMaxRank = computed(() => maxRoleRank(userStore.userRoles));

const roleLabel = (roleName: string): string => {
  void locale.value;
  const key = `roles.${roleName}`;
  const translated = t(key);
  return translated === key ? roleName : translated;
};

const roleBadgeType = (
  roleName: string,
): 'primary' | 'success' | 'warning' | 'error' | 'info' => {
  if (roleName === ROLES.SUPER_ADMIN || roleName === ROLES.ADMIN) {
    return 'primary';
  }
  if (roleName === ROLES.CANDIDATE) {
    return 'info';
  }
  return 'success';
};

const isAssignableRoleName = (roleName: string): boolean =>
  !NON_ASSIGNABLE_ROLE_NAMES.has(roleName) &&
  getRoleRank(roleName) <= actorMaxRank.value;

const assignableRoles = computed(() =>
  systemRoles.value.filter((role) => isAssignableRoleName(role.ROLE_NAME)),
);

const assignableRoleOptions = computed(() =>
  assignableRoles.value.map((role) => ({
    label: roleLabel(role.ROLE_NAME),
    value: role.ROLE_ID,
  })),
);

const protectedRoleLabels = computed(() => {
  if (!editingPerson.value || protectedRoleIds.value.length === 0) {
    return [] as string[];
  }
  return (editingPerson.value.ROLES ?? [])
    .filter((role) => protectedRoleIds.value.includes(role.ROLE_ID))
    .map((role) => roleLabel(role.ROLE_NAME));
});

const roleFilterOptions = computed(() =>
  systemRoles.value
    .filter((role) => getRoleRank(role.ROLE_NAME) <= actorMaxRank.value)
    .map((role) => ({
      label: roleLabel(role.ROLE_NAME),
      value: role.ROLE_NAME,
    })),
);

const formatFullName = (person: MsgPerson): string => {
  const prefix = person.PRF_NAMETH?.trim() || '';
  const first = person.PSN_FNAMETH?.trim() || person.PSN_FNAMEEN?.trim() || '';
  const last = person.PSN_LNAMETH?.trim() || person.PSN_LNAMEEN?.trim() || '';
  const full = [prefix, first, last].filter(Boolean).join(' ').trim();
  return full || '—';
};

const personInitials = (person: MsgPerson): string => {
  const first = (person.PSN_FNAMETH || person.PSN_FNAMEEN || '').trim();
  const last = (person.PSN_LNAMETH || person.PSN_LNAMEEN || '').trim();
  const initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  return initials || person.PSN_ID.slice(0, 2).toUpperCase() || '?';
};

const isRoleSelected = (roleId: number): boolean =>
  selectedRoleIds.value.includes(roleId);

const toggleRole = (roleId: number): void => {
  if (isRoleSelected(roleId)) {
    selectedRoleIds.value = selectedRoleIds.value.filter((id) => id !== roleId);
  } else {
    selectedRoleIds.value = [...selectedRoleIds.value, roleId];
  }
  roleSelectError.value = '';
};

const columns = computed<QTableColumn[]>(() => [
  {
    name: 'index',
    label: t('admin.personnelRoles.columns.index'),
    field: (_row: MsgPerson, index?: number) =>
      ((pagination.value.page - 1) * pagination.value.rowsPerPage || 0) + (index ?? 0) + 1,
    align: 'center',
  },
  {
    name: 'psnId',
    label: t('admin.personnelRoles.columns.psnId'),
    field: 'PSN_ID',
    align: 'center',
  },
  {
    name: 'fullName',
    label: t('admin.personnelRoles.columns.fullName'),
    field: 'PSN_FNAMETH',
    align: 'left',
  },
  {
    name: 'email',
    label: t('admin.personnelRoles.columns.email'),
    field: 'PSN_EMAIL_BUU',
    align: 'left',
    format: (val: string | null) => val || '—',
  },
  {
    name: 'username',
    label: t('admin.personnelRoles.columns.username'),
    field: 'PSN_USERNAME',
    align: 'center',
    format: (val: string | null) => val || '—',
  },
  {
    name: 'roles',
    label: t('admin.personnelRoles.columns.roles'),
    field: 'ROLES',
    align: 'center',
  },
  {
    name: 'retire',
    label: t('admin.personnelRoles.columns.status'),
    field: 'PSN_RETIRE',
    align: 'center',
  },
  {
    name: 'tools',
    label: t('admin.personnelRoles.columns.tools'),
    field: 'PSN_ID',
    align: 'center',
  },
]);

const loadRoles = async (): Promise<void> => {
  try {
    systemRoles.value = await fetchSystemRoles();
  } catch (error) {
    console.error('Failed to load system roles:', error);
    systemRoles.value = [];
    $q.notify({
      type: 'negative',
      message: t('admin.personnelRoles.errors.loadRolesFailed'),
    });
  }
};

const loadData = async (): Promise<void> => {
  isLoading.value = true;
  try {
    const params: {
      page: number;
      limit: number;
      search?: string;
      role?: string;
    } = {
      page: pagination.value.page,
      limit: pagination.value.rowsPerPage,
    };
    const trimmedSearch = searchQuery.value.trim();
    if (trimmedSearch) {
      params.search = trimmedSearch;
    }
    if (roleFilter.value) {
      params.role = roleFilter.value;
    }
    const result = await fetchMsgPersons(params);
    rows.value = result.data;
    pagination.value.rowsNumber = result.meta.total;
  } catch (error) {
    console.error('Failed to load msg-persons:', error);
    rows.value = [];
    pagination.value.rowsNumber = 0;
    $q.notify({
      type: 'negative',
      message: t('admin.personnelRoles.errors.loadFailed'),
    });
  } finally {
    isLoading.value = false;
  }
};

const onRequest = (props: TableRequestProps): void => {
  pagination.value.page = props.pagination.page;
  pagination.value.rowsPerPage = props.pagination.rowsPerPage;
  void loadData();
};

const onRoleFilterChange = (): void => {
  pagination.value.page = 1;
  void loadData();
};

const openEditDialog = (person: MsgPerson): void => {
  editingPerson.value = person;
  const currentRoles = person.ROLES ?? [];
  protectedRoleIds.value = currentRoles
    .filter((role) => getRoleRank(role.ROLE_NAME) > actorMaxRank.value)
    .map((role) => role.ROLE_ID);
  selectedRoleIds.value = currentRoles
    .filter((role) => isAssignableRoleName(role.ROLE_NAME))
    .map((role) => role.ROLE_ID);
  roleSelectError.value = '';
  showEditDialog.value = true;
};

const closeEditDialog = (): void => {
  showEditDialog.value = false;
  editingPerson.value = null;
  selectedRoleIds.value = [];
  protectedRoleIds.value = [];
  roleSelectError.value = '';
};

const saveRoles = async (): Promise<void> => {
  if (!editingPerson.value) {
    return;
  }
  const roleIds = [
    ...new Set([...protectedRoleIds.value, ...selectedRoleIds.value]),
  ];
  roleSelectError.value = '';
  isSaving.value = true;
  try {
    await updateMsgPersonRoles(editingPerson.value.PSN_ID, { roleIds });
    $q.notify({
      type: 'positive',
      message: t('admin.personnelRoles.messages.saved'),
    });
    closeEditDialog();
    await loadData();
  } catch (error: unknown) {
    console.error('Failed to update person roles:', error);
    const axiosError = error as {
      response?: { status?: number; data?: { message?: string | string[] } };
    };
    const status = axiosError.response?.status;
    const rawMessage = axiosError.response?.data?.message;
    const apiMessage = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;
    $q.notify({
      type: 'negative',
      message:
        status === 403
          ? t('admin.personnelRoles.errors.forbidden')
          : apiMessage || t('admin.personnelRoles.errors.saveFailed'),
    });
  } finally {
    isSaving.value = false;
  }
};

watch(searchQuery, () => {
  if (searchDebounce) clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    pagination.value.page = 1;
    void loadData();
  }, 350);
});

onMounted(() => {
  void loadRoles();
  void loadData();
});
</script>

<style scoped lang="scss">
.roles-dialog-card {
  width: min(640px, 95vw);
  max-width: 100%;
  border-radius: 16px !important;
  background: var(--surface-card);
  box-shadow: var(--dialog-shadow);
}

.roles-dialog-header {
  padding: 20px 20px 16px;
}

.roles-dialog-header__icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--badge-primary-bg);
  flex-shrink: 0;
}

.roles-dialog-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.01em;
}

.roles-dialog-subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: var(--text-secondary, #64748b);
  line-height: 1.4;
}

.roles-dialog-body {
  padding: 20px 24px;
  max-height: min(70vh, 640px);
  overflow-y: auto;
}

.person-card {
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid var(--neutral-200);
  background: var(--surface-page, #f8fafc);
}

.person-card__avatar {
  font-weight: 700;
  font-size: 15px;
  flex-shrink: 0;
}

.person-card__name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.person-card__meta,
.person-card__email {
  font-size: 12px;
  margin-top: 2px;
}

.roles-section-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

.roles-section-hint {
  font-size: 13px;
  line-height: 1.4;
}

.roles-count-badge {
  font-weight: 600;
  padding: 4px 10px;
}

.role-option-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 599px) {
    grid-template-columns: 1fr;
  }
}

.role-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 52px;
  padding: 12px 14px;
  border: 1.5px solid var(--neutral-200);
  border-radius: 12px;
  background: var(--surface-card);
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    border-color: var(--primary-light);
    background: var(--badge-primary-bg);
  }

  &--selected {
    border-color: var(--primary);
    background: var(--badge-primary-bg);
    box-shadow: 0 0 0 1px var(--primary-light-alpha-20);

    .role-option__check {
      color: var(--primary);
    }

    .role-option__label {
      font-weight: 700;
      color: var(--primary-dark);
    }
  }
}

.role-option__check {
  color: var(--neutral-400, #94a3b8);
  flex-shrink: 0;
}

.role-option__label {
  font-size: 14px;
  line-height: 1.3;
}

.roles-error {
  color: var(--negative);
  font-size: 13px;
}

.protected-roles-note {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--badge-info-bg, #e3f2fd);
  color: var(--text-primary);
  font-size: 12px;
  line-height: 1.4;
}

.roles-dialog-actions {
  padding: 16px 20px 20px;
}

.dialog-footer-btn {
  min-width: 120px;
}

.cancel-btn {
  background-color: var(--neutral-gray-light, #f1f5f9) !important;
  color: var(--text-primary) !important;
}

.cell-inner-padding {
  padding-left: var(--space-md);
}
</style>
