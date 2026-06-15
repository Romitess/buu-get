<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md">
      <div class="col-12">
        <q-card class="bg-primary text-white text-center q-pa-xl">
          <q-icon name="admin_panel_settings" size="4rem" />
          <div class="text-h4 q-mt-md">Staff Dashboard</div>
          <div class="text-subtitle1">Manage exams and view statistics (Mock Page)</div>
        </q-card>
      </div>

      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6">Recent Activity</div>
          </q-card-section>
          <q-separator />
          <q-list>
            <q-item v-for="i in 3" :key="i">
              <q-item-section avatar>
                <q-icon name="history" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Activity {{ i }}</q-item-label>
                <q-item-label caption>System update</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6">Quick Actions</div>
          </q-card-section>
          <q-separator />
          <q-card-actions align="center" class="q-pa-md q-gutter-md">
            <q-btn color="primary" icon="add" label="Create Exam" />
            <q-btn color="secondary" icon="people" label="Manage Users" />
            <q-btn color="warning" icon="settings" label="Settings" />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
// Logic for staff dashboard can go here
</script>

<style scoped>
/* Add any specific styles here */
</style>
