<template>
  <div class="home-main-content q-py-xl">
    <!-- Section 1: Test Format -->
    <div class="q-mb-xl">
      <div class="row items-center q-mb-lg no-wrap">
        <q-icon name="menu_book" color="primary" size="sm" class="q-mr-sm" />
        <div class="text-h6 text-weight-bolder text-dark">
          {{ $t('home.testFormat.title') }}
        </div>
        <q-space />
      </div>
      <q-separator class="q-mb-xl" />

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
      <div class="row items-center q-mb-lg no-wrap">
        <q-icon name="fact_check" color="primary" size="sm" class="q-mr-sm" />
        <div class="text-h6 text-weight-bolder text-dark">
          {{ $t('home.registrationSteps.title') }}
        </div>
        <q-space />
      </div>
      <q-separator class="q-mb-xl" />

      <div class="row q-col-gutter-xl">
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
            :title="$t('home.registrationSteps.steps.s4.title')"
            :description="$t('home.registrationSteps.steps.s4.description')"
          />
        </div>
      </div>
    </div>

    <!-- Section 3: Exam Rules -->
    <div>
      <div class="row items-center q-mb-lg no-wrap">
        <q-icon name="gavel" color="primary" size="sm" class="q-mr-sm" />
        <div class="text-h6 text-weight-bolder text-dark">
          {{ $t('home.examRules.title') }}
        </div>
        <q-space />
      </div>
      <q-separator class="q-mb-xl" />
      <!-- Rules content could go here -->
    </div>
  </div>
</template>

<script setup lang="ts">
import HomeCard from './home-card.vue';
import HomeStep from './home-step.vue';
</script>

<style scoped>
.home-main-content {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
