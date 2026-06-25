<template>
  <q-card flat class="pb-card">
    <div class="text-h6 pb-section-title q-mb-lg">{{ $t('admin.pageBuilder.bannerInfo') }}</div>

    <div class="row q-col-gutter-xl items-stretch">
      <div class="col-12 col-md-6 column justify-center">
        <div class="banner-list-container">
          <div class="column q-gutter-y-md">
            <PageBuilderBannerItem
              v-for="(box, index) in section.boxes"
              :key="`${box.imagePath}-${index}`"
              :image-path="box.imagePath"
              draggable="true"
              @dragstart="onDragStart(index)"
              @dragover.prevent
              @drop.prevent="onDrop(index)"
              @dragend="onDragEnd"
              @remove="removeBanner(index)"
            />

            <div
              v-if="section.boxes.length === 0"
              class="banner-empty column flex-center text-grey-6"
            >
              <q-icon name="image" size="40px" />
              <div class="text-body2 q-mt-sm">{{ $t('admin.pageBuilder.empty.banner') }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-6 column">
        <PageBuilderBannerUploader @uploaded="addBanner" />
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PageBuilderBannerItem from './page-builder-banner-item.vue';
import PageBuilderBannerUploader from './page-builder-banner-uploader.vue';
import type { BannerBoxContent, EditorSection } from 'src/types/page-builder.types';

const section = defineModel<EditorSection<BannerBoxContent>>({ required: true });

const dragIndex = ref<number | null>(null);

const addBanner = (imagePath: string): void => {
  section.value.boxes.push({
    sortOrder: section.value.boxes.length + 1,
    imagePath,
    active: true,
  });
};

const removeBanner = (index: number): void => {
  section.value.boxes.splice(index, 1);
};

const onDragStart = (index: number): void => {
  dragIndex.value = index;
};

const onDrop = (targetIndex: number): void => {
  const from = dragIndex.value;
  if (from === null || from === targetIndex) return;
  const [moved] = section.value.boxes.splice(from, 1);
  if (moved) section.value.boxes.splice(targetIndex, 0, moved);
  dragIndex.value = null;
};

const onDragEnd = (): void => {
  dragIndex.value = null;
};
</script>

<style scoped lang="scss">
.pb-card {
  padding: 24px 32px;
  border-radius: var(--radius-md);
  background-color: var(--surface-card);
  box-shadow: var(--shadow-card) !important;
}

.pb-section-title {
  font-weight: 600;
  color: var(--pb-heading-color);
}

.banner-list-container {
  height: 288px;
  overflow-y: auto;
  padding-right: 16px;
  scrollbar-width: thin;
  scrollbar-color: var(--pb-scrollbar-thumb) var(--pb-scrollbar-track);

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: var(--pb-scrollbar-track);
    border-radius: var(--radius-md);
  }
  &::-webkit-scrollbar-thumb {
    background: var(--pb-scrollbar-thumb);
    border-radius: var(--radius-md);
    
    &:hover {
      background: var(--text-secondary);
    }
  }
}

.banner-empty {
  height: 200px;
  border: 1px dashed var(--neutral-300);
  border-radius: var(--radius-md);
}

@media (max-width: 1023px) {
  .banner-list-container {
    height: 264px;
  }
}
</style>
