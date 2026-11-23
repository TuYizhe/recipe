<script setup>
import { ref, watch } from 'vue'
import { imageUrl } from '../db'
const props = defineProps({ id: [Number, null], alt: { type: String, default: '' } })
const src = ref(null)
watch(() => props.id, async id => { src.value = id ? await imageUrl(id) : null }, { immediate: true })
</script>

<template>
  <img v-if="src" :src="src" :alt="alt" draggable="false" />
  <slot v-else />
</template>
