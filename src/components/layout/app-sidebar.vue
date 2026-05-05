<template>
  <!-- === Desktop Sidebar === -->
  <aside
    class="app-sidebar"
    :class="{
      'app-sidebar--expanded': sidebarStore.isExpanded,
      'app-sidebar--mobile-open': sidebarStore.isMobileOpen,
    }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Logo Area -->
    <div class="sidebar-logo">
      <div class="sidebar-logo__img-wrap">
        <img src="~assets/img/logobuu.png" alt="BUU Logo" class="sidebar-logo__img" />
      </div>
      <Transition name="fade-text">
        <span v-if="sidebarStore.isExpanded" class="sidebar-logo__text">
          BUU-GET
        </span>
      </Transition>
    </div>

    <!-- Navigation Groups -->
    <nav class="sidebar-nav" aria-label="Main Navigation">
      <div
        v-for="(group, groupIndex) in sidebarStore.filteredNavigationGroups"
        :key="group.title"
        class="sidebar-group"
      >
        <!-- Group Divider (after first group) -->
        <div v-if="groupIndex > 0" class="sidebar-divider" />

        <!-- Group Title (visible only when expanded) -->
        <Transition name="fade-text">
          <span
            v-if="sidebarStore.isExpanded"
            class="sidebar-group__title"
          >
            {{ group.title }}
          </span>
        </Transition>

        <!-- Menu Items -->
        <template v-for="item in group.items.filter((i) => !i.hidden)" :key="item.name">
          <!-- === Dropdown Menu Item (With Children) === -->
          <q-expansion-item
            v-if="item.children && item.children.length > 0"
            dense
            dense-toggle
            expand-icon-class="text-white"
            class="sidebar-expansion"
            :default-opened="isActive(item.path)"
          >
            <!-- Parent Header -->
            <template v-slot:header>
              <div
                class="sidebar-item sidebar-item--parent"
                :class="{ 'sidebar-item--active': isActive(item.path) }"
              >
                <div class="sidebar-item__icon">
                  <q-icon :name="item.icon" size="22px" />
                </div>
                <Transition name="fade-text">
                  <span v-if="sidebarStore.isExpanded" class="sidebar-item__label">
                    {{ item.label }}
                  </span>
                </Transition>

                <!-- Tooltip (visible when collapsed) -->
                <q-tooltip
                  v-if="!sidebarStore.isExpanded"
                  anchor="center right"
                  self="center left"
                  :offset="[12, 0]"
                  class="sidebar-tooltip"
                >
                  {{ item.label }}
                </q-tooltip>
              </div>
            </template>

            <!-- Children Menu Items -->
            <router-link
              v-for="child in item.children"
              :key="child.name"
              :to="child.path"
              class="sidebar-item sidebar-item--child"
              :class="{ 'sidebar-item--active': isActive(child.path) }"
              :aria-label="child.label"
              @click="handleItemClick"
            >
              <!-- Active Indicator Bar -->
              <div v-if="isActive(child.path)" class="sidebar-item__indicator" />

              <div class="sidebar-item__icon">
                <q-icon :name="child.icon" size="20px" />
              </div>

              <Transition name="fade-text">
                <span v-if="sidebarStore.isExpanded" class="sidebar-item__label">
                  {{ child.label }}
                </span>
              </Transition>
            </router-link>
          </q-expansion-item>

          <!-- === Regular Menu Item (Single) === -->
          <router-link
            v-else
            :to="item.path"
            class="sidebar-item"
            :class="{ 'sidebar-item--active': isActive(item.path) }"
            :aria-label="item.label"
            @click="handleItemClick"
          >
            <!-- Active Indicator Bar -->
            <div v-if="isActive(item.path)" class="sidebar-item__indicator" />

            <!-- Icon -->
            <div class="sidebar-item__icon">
              <q-icon :name="item.icon" size="22px" />

              <!-- Badge -->
              <span v-if="item.badge && item.badge > 0" class="sidebar-item__badge">
                {{ item.badge > 99 ? '99+' : item.badge }}
              </span>
            </div>

            <!-- Label (visible when expanded) -->
            <Transition name="fade-text">
              <span v-if="sidebarStore.isExpanded" class="sidebar-item__label">
                {{ item.label }}
              </span>
            </Transition>

            <!-- Tooltip (visible when collapsed) -->
            <q-tooltip
              v-if="!sidebarStore.isExpanded"
              anchor="center right"
              self="center left"
              :offset="[12, 0]"
              class="sidebar-tooltip"
            >
              {{ item.label }}
            </q-tooltip>
          </router-link>
        </template>
      </div>
    </nav>


  </aside>

  <!-- === Mobile Overlay === -->
  <Transition name="fade">
    <div
      v-if="sidebarStore.isMobileOpen"
      class="sidebar-overlay"
      @click="sidebarStore.closeMobile()"
    />
  </Transition>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useSidebarStore } from 'src/stores/sidebar.store';

const route = useRoute();
const sidebarStore = useSidebarStore();

/**
 * ตรวจสอบว่า route path ปัจจุบัน match กับ item.path หรือไม่
 */
function isActive(path: string): boolean {
  if (path === '/') {
    return route.path === '/';
  }
  return route.path.startsWith(path);
}

/**
 * Desktop: hover expand
 */
function handleMouseEnter(): void {
  if (window.innerWidth > 1024) {
    sidebarStore.setExpanded(true);
  }
}

function handleMouseLeave(): void {
  if (window.innerWidth > 1024) {
    sidebarStore.setExpanded(false);
  }
}

/**
 * Mobile: click menu item → close drawer
 */
function handleItemClick(): void {
  if (window.innerWidth <= 1024) {
    sidebarStore.closeMobile();
  }
}
</script>

<style scoped lang="scss">
// === Sidebar Container ===
.app-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background: var(--surface-sidebar);
  display: flex;
  flex-direction: column;
  z-index: 2000;
  transition:
    width var(--transition-smooth),
    transform var(--transition-smooth);
  overflow-x: hidden;
  overflow-y: auto;

  &--expanded {
    width: var(--sidebar-expanded-width);
  }
}

// === Logo ===
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  height: var(--header-height);
  flex-shrink: 0;

  &__img-wrap {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  &__text {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--primary);
    white-space: nowrap;
    letter-spacing: 0.02em;
  }
}

// === Navigation ===
.sidebar-nav {
  flex: 1;
  padding: 8px;
  display: flex;
  flex-direction: column;
}

.sidebar-group {
  &__title {
    display: block;
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--buu-gray-light);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 8px 12px 4px;
    white-space: nowrap;
  }
}

.sidebar-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 4px 12px;
}

// === Menu Item ===
.sidebar-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
  height: 44px;
  border-radius: 10px;
  color: var(--text-on-dark);
  text-decoration: none;
  cursor: pointer;
  transition:
    background var(--transition-fast),
    color var(--transition-fast);
  margin: 2px 0;
  border: none;
  background: none;
  width: 100%;
  font-family: inherit;
  font-size: inherit;

  &:hover {
    background: var(--surface-sidebar-hover);
    color: #ffffff;
  }

  &--active {
    background: var(--surface-sidebar-active);
    color: var(--primary) !important;

    .sidebar-item__icon {
      color: var(--primary);
    }
  }

  &__indicator {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 24px;
    border-radius: 0 3px 3px 0;
    background: var(--primary);
    animation: slideInLeft 0.25s ease-out;
  }

  &__icon {
    position: relative;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: 8px;
    transition: background var(--transition-fast);
  }

  &__badge {
    position: absolute;
    top: 2px;
    right: 2px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 8px;
    background: var(--primary);
    color: var(--text-on-primary);
    font-size: 0.6rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  &__label {
    font-size: 0.875rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
  }

  // --- Child Item Style ---
  &--child {
    margin-left: 12px;
    width: calc(100% - 12px);
    opacity: 0.8;

    &:hover {
      opacity: 1;
    }
    
    .sidebar-item__icon {
      margin-left: 4px;
    }
  }
}

// === Expansion Item Customization ===
:deep(.sidebar-expansion) {
  .q-item {
    padding: 0 !important;
    min-height: auto !important;
  }

  .q-expansion-item__container > .q-item {
    border-radius: 10px;
  }

  .q-expansion-item__content {
    padding: 2px 0 2px 8px;
  }
}

.app-sidebar:not(.app-sidebar--expanded) :deep(.q-expansion-item__content) {
  display: none !important;
}





// === Tooltip ===
.sidebar-tooltip {
  background: var(--surface-sidebar);
  color: #fff;
  font-size: 0.8rem;
  padding: 6px 12px;
  border-radius: 6px;
  box-shadow: var(--shadow-md);
}

// === Mobile Overlay ===
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1999;
  backdrop-filter: blur(2px);
}

// === Text Transition ===
.fade-text-enter-active {
  transition: opacity 0.2s ease 0.05s;
}

.fade-text-leave-active {
  transition: opacity 0.1s ease;
}

.fade-text-enter-from,
.fade-text-leave-to {
  opacity: 0;
}

// === Fade Transition ===
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// === Responsive: Mobile ===
@media (max-width: 1024px) {
  .app-sidebar {
    transform: translateX(-100%);
    width: var(--sidebar-expanded-width);

    &--mobile-open {
      transform: translateX(0);
    }
  }
}
</style>
