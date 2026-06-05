<template>
  <q-page class="page-container registrant-detail-page">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('admin.registrantManagement.detail.pageTitle')"
      :subtitle="$t('admin.registrantManagement.detail.pageSubtitle')"
    />

    <div v-if="isLoading" class="flex flex-center q-pa-xl">
      <q-spinner-dots color="primary" size="40px" />
    </div>

    <main v-else-if="enrollment">
      <RegistrantPersonalDetail :enrollment="enrollment" />

      <div class="action-container row justify-end q-mt-sm q-gutter-sm q-gutter-md-md">
        <AppButton
          :label="$t('admin.registrantManagement.detail.actions.requestFix')"
          color="negative"
          unelevated
          class="action-btn col-12 col-sm-auto"
          @click="showFixDialog = true"
        />
        <AppButton
          :label="$t('admin.registrantManagement.detail.actions.editByStaff')"
          color="grey-3"
          text-color="dark"
          unelevated
          class="action-btn col-12 col-sm-auto"
          @click="showEditDialog = true"
        />
        <AppButton
          :label="$t('admin.registrantManagement.detail.actions.confirmVerify')"
          color="primary"
          unelevated
          class="action-btn col-12 col-sm-auto"
          @click="handleVerify"
        />
      </div>
    </main>

    <section v-else class="text-center q-pa-xl">
      <q-icon name="error_outline" size="64px" color="negative" />
      <h2 class="text-h6 q-mt-md">
        {{ $t('admin.registrantManagement.detail.errors.notFound') }}
      </h2>
      <AppButton
        :label="$t('admin.registrantManagement.detail.actions.backToMain')"
        color="primary"
        class="q-mt-lg"
        @click="goBack"
      />
    </section>

    <RequestFixDialog
      v-model="showFixDialog"
      :full-name="registrantName"
      :reg-id="registrantRegId"
      :exam-date="examDateFormatted"
      @submit="handleFixSubmit"
    />

    <RegistrantEditDialog
      v-model="showEditDialog"
      :enrollment="enrollment"
      @save="handleEditSave"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar, date } from 'quasar';
import { useI18n } from 'vue-i18n';

import AppButton from 'src/components/base/app-button.vue';
import RegistrantPersonalDetail from 'src/components/registrant-personal-detail.vue';
import RequestFixDialog from 'src/components/request-fix-dialog.vue';
import RegistrantEditDialog from 'src/components/registrant-edit-dialog.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import {
  fetchEnrollmentById,
  updateEnrollmentStatus,
  requestEnrollmentFix,
} from 'src/services/enrollment.service';
import { getUsersFromApi, updateUserProfileByAdmin } from 'src/services/user.service';
import { useUserStore } from 'src/stores/user.store';
import { VerifyStatus } from 'src/types/enrollment.types';
import type { BackendEnrollmentDetail } from 'src/types/enrollment.types';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const { t } = useI18n();
const userStore = useUserStore();

const enrollment = ref<BackendEnrollmentDetail | null>(null);
const isLoading = ref(true);
const showFixDialog = ref(false);
const showEditDialog = ref(false);

const registrantName = computed(
  () =>
    enrollment.value?.USER?.PROFILE?.userFullnameTh ||
    t('admin.registrantManagement.detail.errors.unknownName'),
);
const registrantRegId = computed(
  () => `EX-2025-${String(enrollment.value?.ERM_ID || 0).padStart(5, '0')}`,
);
const examDateFormatted = computed(() => {
  const examDate = enrollment.value?.SESSION?.EXAM?.EXAM_DATE;
  return examDate
    ? date.formatDate(examDate, 'DD MMM YYYY')
    : t('admin.registrantManagement.detail.errors.unspecifiedDate');
});

const loadData = async (): Promise<void> => {
  const ermId = Number(route.params.ermId);
  if (isNaN(ermId)) {
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  try {
    const detail = await fetchEnrollmentById(ermId);
    const latestUsers = await getUsersFromApi();
    const latestUser = latestUsers.find((user) => user.id === detail.USER_ID);

    if (latestUser?.userImagePath) {
      detail.USER.USER_IMAGE = latestUser.userImagePath;
    }

    enrollment.value = detail;
  } catch (error) {
    console.error('Error fetching enrollment:', error);
    $q.notify({
      type: 'negative',
      message: t('admin.registrantManagement.detail.errors.cannotFetch'),
    });
  } finally {
    isLoading.value = false;
  }
};

const goBack = (): void => {
  router.back();
};

const handleEditSave = async (payload: Record<string, unknown>): Promise<void> => {
  if (!enrollment.value?.USER?.PROFILE?.userProfileId) return;

  $q.loading.show({
    message: t('admin.registrantManagement.detail.staffEdit.saving'),
  });

  try {
    const token = userStore.accessToken || localStorage.getItem('access_token') || '';
    await updateUserProfileByAdmin(token, enrollment.value.USER.PROFILE.userProfileId, payload);

    $q.notify({
      type: 'positive',
      message: t('admin.registrantManagement.detail.staffEdit.saveSuccess'),
    });

    await loadData();
  } catch (error) {
    console.error('Error updating profile by staff:', error);
    $q.notify({
      type: 'negative',
      message: t('admin.registrantManagement.detail.staffEdit.saveError'),
    });
  } finally {
    $q.loading.hide();
  }
};

const handleFixSubmit = async (payload: {
  fixDeadline: string;
  reasons: string[];
  notes: string;
}): Promise<void> => {
  if (!enrollment.value) return;

  $q.loading.show({
    message: t('admin.registrantManagement.detail.notifications.sending'),
  });

  try {
    const resolvedRoute = router.resolve({
      name: 'user-profile',
      query: { from: 'email' },
    });
    const profileUrl = new URL(
      resolvedRoute.href,
      import.meta.env.VITE_APP_URL || window.location.origin,
    ).href;

    await requestEnrollmentFix(enrollment.value.ERM_ID, {
      fixDeadline: payload.fixDeadline,
      reasons: payload.reasons,
      notes: payload.notes || undefined,
      profileUrl,
    });

    $q.notify({
      type: 'positive',
      message: t('admin.registrantManagement.detail.notifications.sendSuccess'),
    });

    void router.push({
      name: 'admin-exam-registrants',
      params: { examId: enrollment.value.SESSION.EXAM_ID },
    });
  } catch (error) {
    console.error('Error requesting profile fix:', error);
    $q.notify({
      type: 'negative',
      message: t('admin.registrantManagement.detail.notifications.sendError'),
    });
  } finally {
    $q.loading.hide();
  }
};

const handleVerify = async (): Promise<void> => {
  if (!enrollment.value) return;

  try {
    await updateEnrollmentStatus(enrollment.value.ERM_ID, {
      ERM_VERIFY_STATUS: VerifyStatus.PASS,
    });

    $q.notify({
      type: 'positive',
      message: t('admin.registrantManagement.detail.notifications.verifySuccess'),
    });

    void router.push({
      name: 'admin-exam-registrants',
      params: { examId: enrollment.value.SESSION.EXAM_ID },
    });
  } catch (error) {
    console.error('Error updating status:', error);
    $q.notify({
      type: 'negative',
      message: t('admin.registrantManagement.detail.notifications.verifyError'),
    });
  }
};

onMounted(() => {
  void loadData();
});
</script>

<style scoped lang="scss">
.registrant-detail-page {
  padding-top: 16px;
  padding-bottom: 16px;

  @media (min-height: 900px) {
    padding-top: 24px;
    padding-bottom: 24px;
  }
}

.action-btn {
  min-width: 150px;
  height: 52px;
  border-radius: 10px;
  font-weight: 700;

  @media (max-width: $breakpoint-xs-max) {
    min-width: 100%;
    order: -1;
  }
}

@media (max-width: $breakpoint-xs-max) {
  .action-container {
    flex-direction: column;

    .action-btn:nth-child(3) {
      order: 1;
    }
    .action-btn:nth-child(2) {
      order: 2;
    }
    .action-btn:nth-child(1) {
      order: 3;
    }
  }
}
</style>
