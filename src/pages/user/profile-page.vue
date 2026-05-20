<template>
  <div class="page-container profile-page q-pa-lg">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('profile.pageTitleEdit')"
      :subtitle="$t('profile.pageSubtitleEdit')"
    />

    <!-- Warning banner if navigated from email -->
    <Transition name="fade">
      <div
        v-if="isFromEmail"
        class="q-mb-md q-pa-md row no-wrap items-center fix-alert-banner shadow-sm"
      >
        <q-icon name="report_problem" color="warning" size="md" class="q-mr-md" />
        <div>
          <div class="text-weight-bold text-subtitle1 text-warning q-mb-xs">
            {{ $t('profile.fixAlertTitle') }}
          </div>
          <div class="text-body2 text-grey-8">
            {{ $t('profile.fixAlertDesc') }}
          </div>
        </div>
      </div>
    </Transition>

    <!-- Card 1: Identity Info -->
    <q-card class="user-profile-card q-pa-lg q-mb-md" flat bordered>
      <div class="row q-col-gutter-xl">
        <!-- Left: Avatar -->
        <div class="col-12 col-md-4 flex column flex-center">
          <div class="avatar-container q-mb-md">
            <q-avatar size="160px" class="profile-avatar">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Somdream" alt="Avatar" />
            </q-avatar>
            <q-btn
              round
              color="grey-3"
              text-color="dark"
              icon="edit"
              size="sm"
              class="avatar-edit-btn"
              unelevated
            />
          </div>
          <div class="text-weight-medium text-body1">
            {{ $t('profile.testTakerId') }}:
            {{ userStore.currentUser?.nationalId || '66100001' }}
          </div>
        </div>

        <!-- Right: Form Fields -->
        <div class="col-12 col-md-8">
          <div class="row q-col-gutter-md">
            <!-- Row 1 -->
            <div class="col-12 col-md-6">
              <div class="row justify-between items-center q-mb-xs">
                <label class="form-label"
                  >{{ $t('profile.email') }} <span class="text-negative">*</span></label
                >
                <a
                  href="#"
                  @click.prevent="showPasswordDialog = true"
                  class="text-primary text-caption text-weight-medium no-wrap"
                  style="text-decoration: none"
                >
                  {{ $t('profile.pageTitleEditPassword') }}
                </a>
              </div>
              <q-input v-model="formData.email" outlined dense bg-color="white" />
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label"
                >{{ $t('profile.prefix') }} <span class="text-negative">*</span></label
              >
              <q-select
                v-model="formData.title"
                :options="titleOptions"
                outlined
                dense
                bg-color="white"
                dropdown-icon="expand_more"
                emit-value
                map-options
              />
            </div>

            <!-- Row 2 -->
            <div class="col-12 col-md-6">
              <label class="form-label"
                >{{ $t('profile.nationalId') }} <span class="text-negative">*</span></label
              >
              <q-input
                v-model="formData.nationalId"
                outlined
                dense
                bg-color="white"
                mask="#-####-#####-##-#"
                unmasked-value
              />
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label"
                >{{ $t('profile.fullName') }} <span class="text-negative">*</span></label
              >
              <q-input v-model="formData.fullNameTH" outlined dense bg-color="white" />
            </div>

            <!-- Row 3 -->
            <div class="col-12 col-md-6 relative-position">
              <label class="form-label"
                >{{ $t('profile.birthdate') }} <span class="text-negative">*</span></label
              >
              <q-input
                v-model="formData.birthdate"
                outlined
                dense
                bg-color="white"
                readonly
                class="cursor-pointer"
                @click="showCalendar = true"
              >
                <template v-slot:append>
                  <q-icon
                    name="calendar_today"
                    class="cursor-pointer"
                    size="xs"
                    @click.stop="showCalendar = true"
                  />
                  <q-menu
                    v-model="showCalendar"
                    anchor="bottom left"
                    self="top left"
                    class="shadow-5 calendar-menu"
                  >
                    <AppCalendar
                      :model-value="formData.birthdate"
                      @update:model-value="(val) => (formData.birthdate = val)"
                      @click-date="showCalendar = false"
                    />
                  </q-menu>
                </template>
              </q-input>
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label"
                >{{ $t('profile.fullNameEn') }} <span class="text-negative">*</span></label
              >
              <q-input v-model="formData.fullNameEN" outlined dense bg-color="white" />
            </div>
          </div>
        </div>
      </div>
    </q-card>

    <!-- Card 2: Contact & Education Info -->
    <q-card class="user-profile-card q-pa-lg q-mb-xl" flat bordered>
      <!-- Row 1: Education, Faculty on left | Address on right -->
      <div class="row q-col-gutter-xl q-mb-md">
        <div class="col-12 col-md-6">
          <div class="q-mb-md">
            <label class="form-label">{{ $t('profile.education') }}</label>
            <q-select
              v-model="formData.educationLevel"
              :options="educationOptions"
              outlined
              dense
              bg-color="white"
              dropdown-icon="expand_more"
              emit-value
              map-options
            />
          </div>
          <div>
            <label class="form-label">{{ $t('profile.faculty') }}</label>
            <q-input v-model="formData.faculty" outlined dense bg-color="white" />
          </div>
        </div>

        <div class="col-12 col-md-6">
          <label class="form-label"
            >{{ $t('profile.address') }} <span class="text-negative">*</span></label
          >
          <q-input
            v-model="formData.address"
            type="textarea"
            outlined
            dense
            bg-color="white"
            input-style="resize: none; height: 114px;"
          />
        </div>
      </div>

      <!-- Row 2: Institution on left | Phone on right -->
      <div class="row q-col-gutter-xl">
        <div class="col-12 col-md-6">
          <label class="form-label">{{ $t('profile.institution') }}</label>
          <q-input v-model="formData.institution" outlined dense bg-color="white" />
        </div>
        <div class="col-12 col-md-6">
          <label class="form-label"
            >{{ $t('profile.phone') }} <span class="text-negative">*</span></label
          >
          <q-input v-model="formData.phone" outlined dense bg-color="white" />
        </div>
      </div>
    </q-card>

    <!-- Action Buttons -->
    <div class="row justify-end q-gutter-md">
      <q-btn
        unelevated
        :label="$t('profile.cancel')"
        color="grey-3"
        text-color="dark"
        class="action-btn text-weight-bold"
        @click="onCancel"
      />
      <q-btn
        unelevated
        :label="$t('profile.save')"
        color="primary"
        class="action-btn text-weight-bold"
        @click="onSave"
      />
    </div>

    <!-- Password Dialog -->
    <q-dialog v-model="showPasswordDialog" persistent>
      <q-card style="min-width: 400px; border-radius: 16px; padding: 12px">
        <q-card-section class="row items-center q-pb-none justify-between">
          <div class="text-h6 text-weight-bold">
            {{ $t('profile.pageTitleEditPassword') }}
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-py-md">
          <div class="q-mb-md">
            <label class="form-label"
              >{{ $t('profile.currentPassword') }} <span class="text-negative">*</span></label
            >
            <q-input
              v-model="currentPassword"
              type="password"
              outlined
              dense
              bg-color="white"
              placeholder=""
            />
          </div>
          <div class="q-mb-md">
            <label class="form-label"
              >{{ $t('profile.newPassword') }} <span class="text-negative">*</span></label
            >
            <q-input
              v-model="newPassword"
              type="password"
              outlined
              dense
              bg-color="white"
              placeholder=""
            />
          </div>
        </q-card-section>

        <q-card-actions align="center" class="q-pt-none q-pb-md">
          <q-btn
            unelevated
            :label="$t('profile.cancel')"
            color="grey-3"
            text-color="dark"
            style="border-radius: 8px; width: 120px"
            class="text-weight-bold"
            v-close-popup
          />
          <q-btn
            unelevated
            :label="$t('examSchedule.dialogConfirm.confirm')"
            color="primary"
            style="border-radius: 8px; width: 120px"
            class="text-weight-bold"
            @click="onSavePassword"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from 'src/stores/user.store';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppCalendar from 'src/components/app-calendar.vue';
import { TITLE_TH_OPTIONS } from 'src/utils/form-options';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const $q = useQuasar();
const { t } = useI18n();

const isFromEmail = computed(() => route.query.from === 'email');

const showPasswordDialog = ref(false);
const currentPassword = ref('');
const newPassword = ref('');
const showCalendar = ref(false);

interface ProfileFormData {
  email: string;
  title: string;
  nationalId: string;
  fullNameTH: string;
  birthdate: string;
  fullNameEN: string;
  educationLevel: string;
  faculty: string;
  institution: string;
  address: string;
  phone: string;
}

const formData = ref<ProfileFormData>({
  email: '',
  title: 'นาย',
  nationalId: '',
  fullNameTH: '',
  birthdate: '',
  fullNameEN: '',
  educationLevel: 'ปริญญาตรี',
  faculty: '',
  institution: '',
  address: '',
  phone: '',
});

const titleOptions = TITLE_TH_OPTIONS.map((opt) => ({
  label: opt.label,
  value: opt.value,
}));

const educationOptions = computed(() => [
  { label: t('profile.eduHighSchool'), value: 'มัธยมศึกษา' },
  { label: t('profile.eduBachelor'), value: 'ปริญญาตรี' },
  { label: t('profile.eduMaster'), value: 'ปริญญาโท' },
  { label: t('profile.eduDoctor'), value: 'ปริญญาเอก' },
]);

onMounted((): void => {
  const user = userStore.currentUser;
  if (user) {
    formData.value = {
      email: user.email || '',
      title: user.titleTH || 'นาย',
      nationalId: user.nationalId || '',
      fullNameTH: user.fullNameTH || '',
      birthdate: user.birthdate || '',
      fullNameEN: user.fullNameEN || '',
      educationLevel: user.educationLevel || 'ปริญญาตรี',
      faculty: user.faculty || '',
      institution: user.institution || '',
      address: user.address || '',
      phone: user.phone || '',
    };
  }
});

const onCancel = (): void => {
  void router.push('/');
};

const onSave = (): void => {
  $q.notify({
    type: 'positive',
    message: t('profile.dialogUpdateSuccess'),
    position: 'top',
  });
  // TODO: Call API to save data
};

const onSavePassword = (): void => {
  if (!currentPassword.value || !newPassword.value) {
    $q.notify({
      type: 'negative',
      message: t('profile.required'),
      position: 'top',
    });
    return;
  }

  $q.notify({
    type: 'positive',
    message: t('profile.dialogUpdateSuccess'),
    position: 'top',
  });

  currentPassword.value = '';
  newPassword.value = '';
  showPasswordDialog.value = false;
};
</script>

<style scoped lang="scss">
.profile-page {
  background-color: #f9f9f9;
}

.user-profile-card {
  border-radius: 12px;
  border-color: #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02) !important;
}

:deep(.q-field--outlined .q-field__control) {
  border-radius: 12px !important;
}

.avatar-container {
  position: relative;
  display: inline-block;
}

.profile-avatar {
  background-color: #2196f3;
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.avatar-edit-btn {
  position: absolute;
  bottom: 0;
  right: 12px;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.action-btn {
  width: 120px;
  border-radius: 6px;
}

.calendar-menu {
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.fix-alert-banner {
  background: linear-gradient(135deg, #fffaf0 0%, #fff8e1 100%);
  border: 1px solid #ffe082;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(255, 179, 0, 0.05);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
