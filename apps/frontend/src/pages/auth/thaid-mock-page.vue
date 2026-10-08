<template>
  <q-page class="thaid-mock-page flex flex-center q-pa-lg">
    <q-card flat bordered class="thaid-mock-card q-pa-lg">
      <div class="column items-center text-center">
        <svg class="mock-qr" viewBox="0 0 25 25" role="img" aria-hidden="true">
          <rect width="25" height="25" fill="#ffffff" />
          <rect
            v-for="cell in modules"
            :key="cell.key"
            :x="cell.x"
            :y="cell.y"
            width="1"
            height="1"
            fill="#172033"
          />
        </svg>
        <h1 class="text-h6 q-mt-md q-mb-sm">{{ t('auth.thaidMock.title') }}</h1>
        <p class="text-body2 text-grey-7 q-mb-lg">{{ message }}</p>
        <q-btn
          unelevated
          no-caps
          color="primary"
          :label="t('auth.thaidMock.fire')"
          :loading="isFiring"
          @click="fire"
        />
      </div>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { api } from 'src/boot/axios';

const QR_SIZE = 25;
const FINDER = 7;

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const isFiring = ref(false);
const errorMessage = ref('');

const intent = computed<'login' | 'register' | 'update'>(() => {
  const raw = Array.isArray(route.query.intent) ? route.query.intent[0] : route.query.intent;
  if (raw === 'register' || raw === 'update') {
    return raw;
  }
  return 'login';
});

const message = computed(() => errorMessage.value || t('auth.thaidMock.body'));

const modules = computed(() => {
  const cells: { key: string; x: number; y: number }[] = [];
  for (let y = 0; y < QR_SIZE; y += 1) {
    for (let x = 0; x < QR_SIZE; x += 1) {
      if (!isDark(x, y)) {
        continue;
      }
      cells.push({ key: `${x}-${y}`, x, y });
    }
  }
  return cells;
});

function finderDark(localX: number, localY: number): boolean {
  const edge = localX === 0 || localY === 0 || localX === FINDER - 1 || localY === FINDER - 1;
  const core = localX >= 2 && localX <= 4 && localY >= 2 && localY <= 4;
  return edge || core;
}

function isDark(x: number, y: number): boolean {
  if (x < FINDER && y < FINDER) {
    return finderDark(x, y);
  }
  if (x >= QR_SIZE - FINDER && y < FINDER) {
    return finderDark(x - (QR_SIZE - FINDER), y);
  }
  if (x < FINDER && y >= QR_SIZE - FINDER) {
    return finderDark(x, y - (QR_SIZE - FINDER));
  }
  return (x * 3 + y * 5 + ((x * y) % 7)) % 3 !== 0;
}

async function fire(): Promise<void> {
  if (isFiring.value) {
    return;
  }
  isFiring.value = true;
  errorMessage.value = '';
  try {
    const response =
      intent.value === 'update'
        ? await api.post<{ ticket?: string; status?: 'mismatch' | 'error' }>('/thaid/mock/fire-update')
        : await api.post<{ ticket?: string; status?: 'mismatch' | 'error' }>('/thaid/mock/fire', {
            intent: intent.value,
          });
    if (response.data.ticket) {
      await router.replace({ name: 'thaid-callback', query: { ticket: response.data.ticket } });
      return;
    }
    await router.replace({
      name: 'thaid-callback',
      query: { status: response.data.status ?? 'error' },
    });
  } catch {
    isFiring.value = false;
    errorMessage.value = t('auth.thaidMock.fireError');
  }
}
</script>

<style scoped lang="scss">
.thaid-mock-card {
  width: 100%;
  max-width: 420px;
  border-radius: 16px;
}

.mock-qr {
  width: 220px;
  height: 220px;
  border: 12px solid #ffffff;
  border-radius: 12px;
  box-shadow: 0 0 0 1px rgba(23, 32, 51, 0.08);
}
</style>
