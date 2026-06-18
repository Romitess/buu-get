<template>
  <div class="home-main-content q-pb-xl q-pt-none">
    <!-- Section 1: Test Format -->
    <div class="q-mb-xl">
      <div class="row items-center q-mb-md">
        <div class="section-icon q-mr-sm">
          <q-icon name="bookmark" color="white" size="18px" />
        </div>
        <div class="text-h6 text-weight-bolder text-dark">
          {{ $t('home.testFormat.title') }}
        </div>
      </div>
      <q-separator color="grey-6" class="q-mb-md" />
      <div class="row q-col-gutter-lg">
        <div class="col-12 col-md-4">
          <HomeCard
            icon="schedule"
            :title="$t('home.testFormat.cards.time.title')"
            :subtitle="$t('home.testFormat.cards.time.subtitle')"
          />
        </div>
        <div class="col-12 col-md-4">
          <HomeCard
            :title="$t('home.testFormat.cards.part1.title')"
            :subtitle="$t('home.testFormat.cards.part1.subtitle')"
          />
        </div>
        <div class="col-12 col-md-4">
          <HomeCard
            :title="$t('home.testFormat.cards.part2.title')"
            :subtitle="$t('home.testFormat.cards.part2.subtitle')"
          />
        </div>
      </div>
    </div>

    <!-- Section 2: Registration Steps -->
    <div class="q-mb-xl">
      <div class="row items-center q-mb-md">
        <div class="section-icon q-mr-sm">
          <q-icon name="fact_check" color="white" size="18px" />
        </div>
        <div class="text-h6 text-weight-bolder text-dark">
          {{ $t('home.registrationSteps.title') }}
        </div>
      </div>
      <q-separator color="grey-6" class="q-mb-md" />
      <div class="row q-col-gutter-lg">
        <div class="col-12 col-sm-6 col-md-3">
          <HomeStep
            number="01"
            :title="$t('home.registrationSteps.steps.s1.title')"
            :description="$t('home.registrationSteps.steps.s1.description')"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <HomeStep
            number="02"
            :title="$t('home.registrationSteps.steps.s2.title')"
            :description="$t('home.registrationSteps.steps.s2.description')"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <HomeStep
            number="03"
            :title="$t('home.registrationSteps.steps.s3.title')"
            :description="$t('home.registrationSteps.steps.s3.description')"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <HomeStep
            number="04"
            :is-last="true"
            :title="$t('home.registrationSteps.steps.s4.title')"
            :description="$t('home.registrationSteps.steps.s4.description')"
          />
        </div>
      </div>
    </div>

    <!-- Section 3: Exam Rules -->
    <div class="q-mb-xl">
      <div class="row items-center q-mb-md">
        <div class="section-icon q-mr-sm">
          <q-icon name="gavel" color="white" size="18px" />
        </div>
        <div class="text-h6 text-weight-bolder text-dark">
          {{ $t('home.examRules.title') }}
        </div>
      </div>
      <q-separator color="grey-6" class="q-mb-md" />
      <HomeGuidelineSection />
      <HomeVoucherError />
    </div>
  </div>
</template>

<script setup lang="ts">
import HomeCard from './home-card.vue';
import HomeStep from './home-step.vue';
import HomeGuidelineSection from './home-guideline-section.vue';
import HomeVoucherError from './home-voucher-error.vue';
</script>

<style scoped>
.home-main-content {
  max-width: 1300px;
  margin: 15px auto 0;
  padding: 0 10px;
}
.section-icon {
  background: var(--q-primary);
  border-radius: 4px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
