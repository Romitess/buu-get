<template>
  <header class="app-header">
    <!-- Left: Mobile hamburger + Breadcrumb -->
    <div class="header-left">
      <!-- Mobile Menu Toggle -->
      <button
        class="header-menu-btn"
        aria-label="เปิดเมนู"
        @click="sidebarStore.toggleMobile()"
      >
        <q-icon name="menu" size="24px" />
      </button>

      <!-- Breadcrumb / Page Info -->
      <div class="header-breadcrumb">
        <span class="breadcrumb-page">{{ currentPageLabel }}</span>
      </div>
    </div>

    <!-- Right: Actions -->
    <div class="header-right">
      <!-- Search (Desktop only) -->
      <button class="header-action-btn" aria-label="ค้นหา">
        <q-icon name="search" size="20px" />
        <q-tooltip>ค้นหา</q-tooltip>
      </button>

      <!-- Notifications -->
      <button class="header-action-btn" aria-label="การแจ้งเตือน">
        <q-icon name="notifications_none" size="20px" />
        <span class="notification-dot" />
        <q-tooltip>การแจ้งเตือน</q-tooltip>
      </button>

      <!-- Divider -->
      <div class="header-divider" />

      <!-- User Avatar -->
      <button class="header-user" aria-label="โปรไฟล์ผู้ใช้">
        <div class="header-user__avatar">
          <q-icon name="person" size="20px" />
        </div>
        <div class="header-user__info">
          <span class="header-user__name">{{ displayName }}</span>
          <span class="header-user__role">{{ displayRole }}</span>
        </div>
        <q-icon name="expand_more" size="18px" class="header-user__chevron" />

        <!-- User Dropdown Menu -->
        <q-menu
          anchor="bottom right"
          self="top right"
          :offset="[0, 8]"
          class="user-menu"
        >
          <q-list style="min-width: 200px">
            <q-item v-close-popup clickable @click="goToProfile">
              <q-item-section avatar>
                <q-icon name="person" />
              </q-item-section>
              <q-item-section>โปรไฟล์</q-item-section>
            </q-item>
            <q-separator />
            <q-item v-close-popup clickable @click="handleLogout">
              <q-item-section avatar>
                <q-icon name="logout" color="negative" />
              </q-item-section>
              <q-item-section class="text-negative">ออกจากระบบ</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSidebarStore } from 'src/stores/sidebar.store';
import { useUserStore } from 'src/stores/user.store';

const route = useRoute();
const router = useRouter();
const sidebarStore = useSidebarStore();
const userStore = useUserStore();

/** Role label mapping */
const roleLabels: Record<string, string> = {
  admin: 'ผู้ดูแลระบบ',
  staff: 'เจ้าหน้าที่',
  user: 'ผู้ใช้งาน',
};

/**
 * ชื่อแสดงผลบน Header — ใช้ fullName จาก userStore
 */
const displayName = computed<string>(() => {
  return userStore.currentUser?.fullName ?? 'ผู้ใช้งาน';
});

/**
 * Role แสดงผลบน Header — แปลงจาก role code เป็นภาษาไทย
 */
const displayRole = computed<string>(() => {
  const role = userStore.currentUser?.role;
  if (!role) return '';
  return roleLabels[role] ?? role;
});

/**
 * หาชื่อ label ของหน้าปัจจุบัน จาก navigation items
 */
const currentPageLabel = computed<string>(() => {
  const currentPath = route.path;
  const item = sidebarStore.allItems.find((navItem) => {
    if (navItem.path === '/') return currentPath === '/';
    return currentPath.startsWith(navItem.path);
  });
  return item?.label ?? 'หน้าหลัก';
});

/**
 * นำทางไปหน้าโปรไฟล์ (จัดการข้อมูลบัญชี)
 */
function goToProfile(): void {
  void router.push('/accounts');
}

/**
 * ออกจากระบบ — ล้าง session แล้ว redirect ไปหน้า Login
 */
function handleLogout(): void {
  userStore.logout();
  // รอ 1.5 วินาทีให้ Loading แสดงผลจบก่อนค่อยไปหน้า Login
  setTimeout(() => {
    void router.push('/login');
  }, 1500);
}
</script>

<style scoped lang="scss">
.app-header {
  position: sticky;
  top: 0;
  height: var(--header-height);
  background: var(--surface-header);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 1000;
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.92);
}

// === Left Section ===
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-menu-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background var(--transition-fast);

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  @media (max-width: 1024px) {
    display: flex;
  }
}

.header-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
}

.breadcrumb-page {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
}

// === Right Section ===
.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-action-btn {
  position: relative;
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  border-radius: 10px;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background var(--transition-fast),
    color var(--transition-fast);

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--text-primary);
  }
}

.notification-dot {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff4444;
  border: 2px solid var(--surface-header);
}

.header-divider {
  width: 1px;
  height: 28px;
  background: var(--border-color);
  margin: 0 8px;
}

// === User Section ===
.header-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border: none;
  background: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition-fast);

  &:hover {
    background: rgba(0, 0, 0, 0.04);
  }

  &__avatar {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-on-primary);
    flex-shrink: 0;
  }

  &__info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    line-height: 1.2;

    @media (max-width: 600px) {
      display: none;
    }
  }

  &__name {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__role {
    font-size: 0.7rem;
    color: var(--text-muted);
    font-weight: 400;
  }

  &__chevron {
    color: var(--text-muted);

    @media (max-width: 600px) {
      display: none;
    }
  }
}

// === Responsive ===
@media (max-width: 600px) {
  .app-header {
    padding: 0 12px;
  }

  .header-action-btn:first-child {
    display: none; // Hide search on very small screens
  }
}
</style>
