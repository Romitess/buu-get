<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title> BUU GET </q-toolbar-title>

        <q-btn v-if="userStore.isLoggedIn" flat @click="logout" label="Logout" />
        <q-btn v-else flat to="/login" label="Login" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header> Menu </q-item-label>

        <EssentialLink v-for="link in computedLinks" :key="link.title" v-bind="link" />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import EssentialLink from 'components/EssentialLink.vue';
import { useNavigation } from 'src/composables/use-navigation';

const { userStore, computedLinks, leftDrawerOpen, toggleLeftDrawer, logout } = useNavigation();
</script>
