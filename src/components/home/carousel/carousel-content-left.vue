<template>
  <q-card-section class="branding-section column justify-center full-height q-pa-lg q-pa-md-xl">
    <div class="text-overline text-primary text-weight-bolder q-mb-xs">
      {{ $t('carousel.branding.overline') }}
    </div>
    <div class="text-h4 text-md-h3 text-weight-bolder text-dark line-height-1">
      {{ $t('carousel.branding.university') }}
    </div>
    <div class="text-h5 text-md-h4 text-weight-bolder text-primary q-mb-lg">
      {{ $t('carousel.branding.examName') }}
    </div>

    <q-card-section class="q-pa-none q-pl-md border-left-primary q-mb-lg q-mb-md-xl">
      <div class="text-body1 text-grey-9">
        {{ $t('carousel.branding.description1') }}
      </div>
      <div class="text-body1 text-grey-9">
        {{ $t('carousel.branding.description2') }}
      </div>
    </q-card-section>

    <q-list dense>
      <q-item class="q-pa-none q-mb-xs">
        <q-item-section avatar style="min-width: 32px">
          <q-icon name="home_work" color="primary" size="xs" />
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-subtitle2 text-grey-9">
            {{ $t('carousel.branding.institute') }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item class="q-pa-none">
        <q-item-section avatar style="min-width: 32px">
          <q-icon name="language" color="primary" size="xs" />
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-subtitle2 text-grey-9">
            {{ $t('carousel.branding.standard') }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-card-section>
</template>

<style scoped>
.branding-section {
  min-height: 400px;
}
.border-left-primary {
  border-left: 3px solid var(--q-primary);
}
.line-height-1 {
  line-height: 1.1;
}
</style>
