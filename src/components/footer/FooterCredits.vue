<template>
  <div 
    class="row justify-between items-center q-pa-md"
    :class="[
      variant === 'primary' ? 'bg-primary text-white' : 'bg-white text-black shadow-1'
    ]"
  >
    <div>Crafted by the computer center of Burapha University</div>
    <div>&copy; 2026 Copyright All Right Reserved.</div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'white'
}>(), {
  variant: 'primary'
})
</script>
