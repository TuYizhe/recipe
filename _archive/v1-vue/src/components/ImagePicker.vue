<!-- 选一张照片：压缩后存进本地数据库，v-model 是图片 id -->
<script setup>
import { ref } from 'vue'
import { addImage, removeImage } from '../db'
import AsyncImg from './AsyncImg.vue'
import Icon from './Icon.vue'

const props = defineProps({ modelValue: [Number, null], label: { type: String, default: '加照片' }, ratio: { type: String, default: '4 / 3' } })
const emit = defineEmits(['update:modelValue'])
const input = ref(null)
const busy = ref(false)

async function onFile(e) {
  const f = e.target.files?.[0]
  e.target.value = ''
  if (!f) return
  busy.value = true
  try {
    const old = props.modelValue
    emit('update:modelValue', await addImage(f))
    if (old) removeImage(old)
  } finally { busy.value = false }
}
function clear() {
  removeImage(props.modelValue)
  emit('update:modelValue', null)
}
</script>

<template>
  <div class="picker" :style="{ aspectRatio: ratio }">
    <template v-if="modelValue">
      <AsyncImg :id="modelValue" @click="input.click()" />
      <button type="button" class="x" aria-label="删除照片" @click="clear"><Icon name="close" /></button>
    </template>
    <button v-else type="button" class="empty" @click="input.click()">
      <Icon name="camera" /><span>{{ busy ? '处理中…' : label }}</span>
    </button>
    <input ref="input" type="file" accept="image/*" hidden @change="onFile" />
  </div>
</template>

<style scoped>
.picker { position: relative; width: 100%; border-radius: 14px; overflow: hidden; background: var(--paper-2); }
.picker :deep(img) { width: 100%; height: 100%; object-fit: cover; cursor: pointer; }
.empty { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; color: var(--ink-3); font-size: 13px;
  border: 1.5px dashed var(--line); border-radius: 14px; }
.empty svg { width: 26px; height: 26px; }
.x { position: absolute; top: 8px; right: 8px; width: 30px; height: 30px; border-radius: 50%; background: rgba(0,0,0,.55); color: #fff; display: grid; place-items: center; }
.x svg { width: 16px; height: 16px; }
</style>
