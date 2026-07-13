<template>
  <q-card
    class="moodle-dashboard-mockup shadow-2"
    flat
    bordered
    @vue:mounted="emit('tour-dashboard-ready')"
  >
    <!-- Header -->
    <div class="moodle-header row items-center justify-between q-px-md">
      <div class="row items-center">
        <div class="text-h6 text-weight-bold q-mr-lg">BUU-GET</div>
        <button type="button" class="moodle-nav-item active" @click="goToView('overview')">
          My courses
        </button>
      </div>
      <div class="row items-center q-gutter-sm">
        <q-btn flat round dense icon="notifications" color="grey-8" />
        <q-btn flat round dense icon="chat" color="grey-8" />
        <div class="row items-center cursor-pointer q-ml-sm q-pl-sm border-left">
          <q-avatar size="32px">
            <ImageDisplay
              :image-path="userStore.currentUser?.userImagePath"
              width="100%"
              height="100%"
              border-radius="50%"
            />
          </q-avatar>
          <q-icon name="keyboard_arrow_down" color="grey-8" size="20px" />
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="moodle-body row no-wrap">
      <!-- Sidebar -->
      <div class="moodle-sidebar" :class="{ 'moodle-sidebar--collapsed': !sidebarOpen }">
        <!-- Sidebar Header: Title and Menu Button on the same row -->
        <div class="sidebar-header row items-center justify-between no-wrap q-py-sm">
          <div
            v-show="sidebarOpen"
            class="sidebar-title text-weight-bold text-black ellipsis q-pl-md"
          >
            วันที่ 22 มิถุนายน 2569
          </div>
          <q-btn
            flat
            round
            dense
            icon="menu"
            color="black"
            class="sidebar-toggle-btn q-mr-sm"
            @click="sidebarOpen = !sidebarOpen"
          />
        </div>

        <!-- Sidebar content hidden when collapsed -->
        <div class="sidebar-content" v-show="sidebarOpen">
          <q-expansion-item default-opened class="sidebar-exp" v-model="generalOpened">
            <template v-slot:header>
              <div
                class="row items-center no-wrap full-width text-weight-bold sidebar-header-content"
              >
                <q-icon
                  :name="generalOpened ? 'keyboard_arrow_down' : 'keyboard_arrow_right'"
                  class="sidebar-chevron q-mr-xs"
                  size="20px"
                />
                <span>General</span>
              </div>
            </template>
            <q-list>
              <q-item clickable v-ripple class="sidebar-item">
                <q-item-section style="padding-left: 28px">Announcements</q-item-section>
              </q-item>
            </q-list>
          </q-expansion-item>

          <q-expansion-item default-opened class="sidebar-exp" v-model="quizOpened">
            <template v-slot:header>
              <div
                class="row items-center no-wrap full-width text-weight-bold sidebar-header-content"
              >
                <q-icon
                  :name="quizOpened ? 'keyboard_arrow_down' : 'keyboard_arrow_right'"
                  class="sidebar-chevron q-mr-xs"
                  size="20px"
                />
                <span>แบบทดสอบ</span>
              </div>
            </template>
            <q-list>
              <q-item
                clickable
                v-ripple
                class="sidebar-item"
                :class="{
                  'sidebar-item--active': currentView === 'quiz' || currentView === 'attempt',
                }"
                @click="goToView('quiz')"
              >
                <q-item-section style="padding-left: 28px">แบบทดสอบ</q-item-section>
              </q-item>
            </q-list>
          </q-expansion-item>
        </div>
      </div>

      <!-- Main Content Area -->
      <div
        class="moodle-main-content col position-relative"
        :class="currentView === 'attempt' ? 'moodle-main-content--attempt' : 'q-pa-xl'"
      >
        <!-- View 1: My Courses (Overview) -->
        <div v-if="currentView === 'overview'" class="view-overview">
          <div class="text-h4 text-weight-bold q-mb-xs">My courses</div>
          <div class="text-h4 text-weight-bold q-mb-sm">
            Hi, {{ displayName }}! <span class="wave-emoji">✋</span>
          </div>
          <div class="text-h5 q-mb-lg">Course overview</div>

          <!-- Filters -->
          <div class="row q-gutter-md q-mb-xl items-center">
            <q-select
              outlined
              dense
              v-model="filterAll"
              :options="['All']"
              style="width: 100px"
              class="bg-white"
            />
            <q-input
              outlined
              dense
              v-model="searchQuery"
              placeholder="Search"
              style="width: 250px"
              class="bg-white"
            />
            <q-select
              outlined
              dense
              v-model="sortFilter"
              :options="['Sort by course name']"
              style="width: 200px"
              class="bg-white"
            />
            <q-select
              outlined
              dense
              v-model="viewFilter"
              :options="['Card']"
              style="width: 100px"
              class="bg-white"
            />
          </div>

          <!-- Course Card -->
          <div class="row">
            <q-card
              data-tour="course-card"
              class="course-card cursor-pointer shadow-1"
              flat
              bordered
              @click="goToView('course')"
            >
              <div class="course-card-img">
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polygon points="0,0 50,0 25,50" fill="#dadddf" />
                  <polygon points="50,0 100,0 75,50" fill="#ced4da" />
                  <polygon points="0,0 25,50 0,100" fill="#e9ecef" />
                  <polygon points="25,50 75,50 50,100" fill="#dee2e6" />
                  <polygon points="75,50 100,0 100,100" fill="#e9ecef" />
                  <polygon points="0,100 50,100 100,100" fill="#ced4da" />
                </svg>
              </div>
              <q-card-section>
                <div
                  class="text-subtitle1 text-weight-medium text-primary line-height-tight q-mb-md"
                >
                  วันที่ 22 มิถุนายน 2569 (รอบสอบ 9.00)
                </div>
                <div class="text-caption text-grey-8">Category 1</div>
              </q-card-section>
              <q-card-actions align="right" class="q-pt-none">
                <q-btn flat round dense icon="more_vert" color="grey-8" />
              </q-card-actions>
            </q-card>
          </div>
        </div>

        <!-- View 2: Course Detail -->
        <div v-else-if="currentView === 'course'" class="view-course">
          <div class="text-h4 text-weight-bold q-mb-xl">วันที่ 22 มิถุนายน 2569 (รอบสอบ 9.00)</div>

          <q-card flat bordered class="q-mb-md rounded-borders">
            <q-expansion-item default-opened header-class="bg-white text-weight-medium">
              <template v-slot:header>
                <q-item-section avatar>
                  <div class="bg-blue-1 text-primary q-pa-xs rounded-borders flex flex-center">
                    <q-icon name="keyboard_arrow_down" />
                  </div>
                </q-item-section>
                <q-item-section>
                  <div class="text-h6">General</div>
                </q-item-section>
                <q-item-section side>
                  <span class="text-primary cursor-pointer text-body2">Collapse all</span>
                </q-item-section>
              </template>

              <q-card-section class="q-pt-none q-pb-md q-px-xl">
                <div class="row items-center q-pl-lg q-py-sm cursor-pointer hover-text-primary">
                  <q-icon name="forum" size="20px" class="q-mr-md text-grey-8" />
                  <span class="text-body1 text-primary">Announcements</span>
                </div>
              </q-card-section>
            </q-expansion-item>
          </q-card>

          <q-card data-tour="quiz-section" flat bordered class="rounded-borders">
            <q-expansion-item default-opened header-class="bg-white text-weight-medium">
              <template v-slot:header>
                <q-item-section avatar>
                  <div class="bg-blue-1 text-primary q-pa-xs rounded-borders flex flex-center">
                    <q-icon name="keyboard_arrow_down" />
                  </div>
                </q-item-section>
                <q-item-section>
                  <div class="text-h6">แบบทดสอบ</div>
                </q-item-section>
              </template>

              <q-card-section class="q-pt-none q-pb-md q-px-xl">
                <div
                  class="row items-start q-pl-lg q-py-sm cursor-pointer hover-text-primary"
                  @click="goToView('quiz')"
                >
                  <q-icon name="assignment" size="20px" class="q-mr-md q-mt-xs text-grey-8" />
                  <div>
                    <div class="text-body1 text-primary text-weight-medium">แบบทดสอบ</div>
                    <div class="text-caption text-grey-8 q-mt-xs">
                      Opened: Monday, 22 June 2026, 9:00 AM
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-expansion-item>
          </q-card>
        </div>

        <!-- View 3: Quiz Detail -->
        <div v-else-if="currentView === 'quiz'" class="view-quiz">
          <div class="text-caption text-primary q-mb-lg cursor-pointer">
            <span @click="goToView('overview')" class="hover-underline">SSSS</span> /
            <button
              type="button"
              class="breadcrumb-link hover-underline"
              @click="goToView('course')"
            >
              วันที่ 22 มิถุนายน 2569 (รอบสอบ 9.00)
            </button>
            / แบบทดสอบ
          </div>

          <div class="row items-center q-mb-md">
            <q-icon name="assignment" size="28px" class="q-mr-md text-grey-9" />
            <div class="text-h4 text-weight-bold">แบบทดสอบ</div>
          </div>

          <div class="text-body1 text-weight-medium q-mb-lg">
            Opened: Monday, 22 June 2026, 9:00 AM
          </div>

          <q-btn
            data-tour="attempt-quiz"
            color="primary"
            label="Attempt Quiz"
            no-caps
            class="q-px-lg q-py-sm text-weight-bold q-mb-lg rounded-borders"
            @click="goToView('attempt')"
          />

          <div class="text-body1 text-weight-medium">Attempts allowed: 1</div>
        </div>

        <!-- View 4: Quiz Attempt -->
        <MoodleTestSimulation
          v-else-if="currentView === 'attempt'"
          @back="goToView('quiz')"
          @course="goToView('course')"
          @attempt-ready="emit('tour-attempt-ready')"
          @attempt-page-change="emit('tour-attempt-page-change')"
          @restart-tour="emit('restart-tour')"
        />

        <!-- Help Icon at bottom right -->
        <q-btn
          v-if="currentView !== 'attempt'"
          round
          color="grey-5"
          text-color="white"
          icon="question_mark"
          class="absolute-bottom-right q-ma-xl shadow-0"
          size="sm"
          :aria-label="restartTourLabel"
          @click="emit('restart-tour')"
        />
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from 'src/stores/user.store';
import ImageDisplay from 'src/components/base/image-display.vue';
import MoodleTestSimulation from 'src/components/exam-simulation/moodle-test-simulation.vue';

type ViewType = 'overview' | 'course' | 'quiz' | 'attempt';

const emit = defineEmits<{
  'restart-tour': [];
  'tour-dashboard-ready': [];
  'tour-attempt-ready': [];
  'tour-attempt-page-change': [];
  'dashboard-view-change': [view: ViewType];
}>();

const { t } = useI18n();
const userStore = useUserStore();
const currentView = ref<ViewType>('overview');
const sidebarOpen = ref(true);
const generalOpened = ref(true);
const quizOpened = ref(true);

const filterAll = ref('All');
const searchQuery = ref('');
const sortFilter = ref('Sort by course name');
const viewFilter = ref('Card');

const displayName = computed(() => {
  const user = userStore.currentUser;
  if (!user) return 'Student';
  if (user.fullNameTH) return user.fullNameTH;
  if (user.fullNameEN) return user.fullNameEN;
  if (user.email) return user.email.split('@')[0];
  return 'Student';
});

const restartTourLabel = computed(() => t('examSimulation.tour.restartLabel'));

const goToView = (view: ViewType) => {
  currentView.value = view;
  emit('dashboard-view-change', view);
};

defineExpose({
  currentView,
  goToView,
});
</script>

<style scoped lang="scss">
.moodle-dashboard-mockup {
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 700px;
}

.moodle-header {
  height: 60px;
  border-bottom: 1px solid #dee2e6;
  background-color: #ffffff;
}

.moodle-nav-item {
  background: transparent;
  border: 0;
  font-size: 1rem;
  font-family: inherit;
  color: #495057;
  padding: 18px 4px;
  cursor: pointer;

  &.active {
    color: var(--q-primary);
    border-bottom: 3px solid var(--q-primary);
    font-weight: 500;
  }
}

.border-left {
  border-left: 1px solid #dee2e6;
}

.moodle-body {
  flex: 1;
  min-height: 0;
}

// Sidebar
.moodle-sidebar {
  width: 280px;
  min-width: 280px;
  background-color: #f8f9fa;
  overflow-y: auto;
  overflow-x: hidden;
  transition:
    width 0.25s ease,
    min-width 0.25s ease,
    background-color 0.25s ease;

  &--collapsed {
    width: 48px;
    min-width: 48px;
    background-color: #ffffff !important;

    .sidebar-content {
      opacity: 0;
      pointer-events: none;
    }

    .sidebar-header {
      justify-content: center;
      padding: 12px 0 4px;

      .sidebar-toggle-btn {
        margin-right: 0 !important;
      }
    }
  }
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 8px 4px;
  width: 100%;
}

.sidebar-title {
  font-size: 0.95rem;
  color: #000000;
  max-width: calc(100% - 48px);
}

.sidebar-content {
  opacity: 1;
  transition: opacity 0.15s ease;
  white-space: nowrap;
}

// Move expansion chevron to the left, before label
:deep(.sidebar-exp) {
  .q-item {
    padding: 8px 16px;
    min-height: auto;

    /* Hide the default expand icon completely */
    .q-item__section--side {
      display: none !important;
    }

    .q-item__section--main {
      padding: 0;
    }
  }
}

.sidebar-header-content {
  font-size: 1rem;
  color: #212529;
}

.sidebar-chevron {
  color: #212529;
  font-size: 1.25rem;
}

.sidebar-item {
  color: #212529;
  font-size: 0.95rem;
  border-radius: 4px;
  margin: 2px 8px;
  padding: 6px 16px 6px 40px; /* Align text with "General" */
  min-height: auto;
  white-space: nowrap;

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
    color: #0f6cbf;
  }
}

.sidebar-item--active {
  background-color: #e8f0fe;
  color: #0f6cbf;
  font-weight: 500;

  &:hover {
    background-color: #d2e3fc;
  }
}

// Main Content
.moodle-main-content {
  background-color: #ffffff;
  overflow-y: auto;
}

.moodle-main-content--attempt {
  padding: 0 0 0 32px;
}

.wave-emoji {
  display: inline-block;
  font-size: 2rem;
}

// Course Card
.course-card {
  width: 280px;
  border-radius: 8px;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
  }
}

.course-card-img {
  height: 140px;
  width: 100%;
  background-color: #e9ecef;
}

.line-height-tight {
  line-height: 1.3;
}

.breadcrumb-link {
  background: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
  font: inherit;
  padding: 0;
}

.hover-underline:hover {
  text-decoration: underline;
}

.hover-text-primary:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}
</style>
