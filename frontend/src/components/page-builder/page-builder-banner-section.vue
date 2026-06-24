<template>
  <q-card flat bordered class="pb-section">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-subtitle1 text-weight-medium">
        <q-icon name="image" class="q-mr-sm" />แบนเนอร์หน้าแรก
      </div>
      <q-toggle v-model="section.active" label="แสดงบนหน้าแรก" />
    </div>

    <div class="column items-center q-gutter-y-md">
      <div
        v-for="(box, index) in banners"
        :key="index"
        class="banner-item column items-center"
      >
        <ImageUpload
          v-model="box.imagePath"
          folder="/page_builder"
          alt="banner"
          aspect-ratio="5 / 1"
          :crop-width="350"
          :crop-height="70"
          :output-width="1500"
          :output-height="300"
          class="banner-upload"
        />

        <div class="row items-center q-gutter-x-sm q-mt-sm">
          <q-toggle v-model="box.active" size="sm" label="แสดง" />
          <q-btn
            flat
            round
            dense
            icon="arrow_upward"
            :disable="index === 0"
            @click="emit('move', index, index - 1)"
          />
          <q-btn
            flat
            round
            dense
            icon="arrow_downward"
            :disable="index === banners.length - 1"
            @click="emit('move', index, index + 1)"
          />
          <q-btn flat round dense icon="delete" color="negative" @click="emit('remove', index)" />
        </div>
      </div>

      <q-btn
        outline
        color="primary"
        icon="add_circle"
        label="เพิ่มแบนเนอร์"
        class="pb-add-btn"
        @click="emit('add')"
      />
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ImageUpload from 'src/components/base/image-upload.vue';
import type { BannerBoxContent, PageSectionContent } from 'src/types/page-builder.types';

const section = defineModel<PageSectionContent>({ required: true });

const emit = defineEmits<{
  (e: 'add'): void;
  (e: 'remove', index: number): void;
  (e: 'move', from: number, to: number): void;
}>();

const banners = computed(() => section.value.boxes as BannerBoxContent[]);
</script>

<style scoped lang="scss">
.pb-section {
  padding: 20px 24px;
  border-radius: 12px;
}

.banner-item {
  width: 100%;
  // อิงพื้นที่แบนเนอร์เดิมของหน้าแรก (carousel-wrapper max-width: 1500px)
  max-width: 1500px;
}

.banner-upload {
  width: 100%;
  // คงสัดส่วนพื้นที่แบนเนอร์เดิม (~5:1) และ responsive ย่อขยายได้อิสระในระดับหนึ่ง
  aspect-ratio: 5 / 1;
  min-width: 280px;
}

.pb-add-btn {
  border-radius: 8px;
}
</style>
