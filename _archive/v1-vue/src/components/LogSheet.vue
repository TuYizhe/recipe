<!-- “做了一次”：打分 + 心得 + 照片 -->
<script setup>
import { reactive } from 'vue'
import ImagePicker from './ImagePicker.vue'
import Icon from './Icon.vue'
import { removeImage } from '../db'
const emit = defineEmits(['close', 'save'])
const n = new Date()
const today = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
const form = reactive({ date: today, rating: 0, note: '', imageIds: [], pending: null })
function addPhoto(id) { if (id) form.imageIds.push(id); form.pending = null }
function save() {
  const [y, m, d] = form.date.split('-').map(Number)
  const dt = new Date(y, m - 1, d, 12).getTime()
  emit('save', { date: form.date === today ? Date.now() : dt, rating: form.rating, note: form.note.trim(), imageIds: form.imageIds.filter(Boolean) })
}
// 没保存就关掉：把刚存进去的照片清掉
function cancel() {
  form.imageIds.filter(Boolean).forEach(removeImage)
  emit('close')
}
</script>

<template>
  <div class="sheet-mask" @click.self="cancel">
    <div class="sheet">
      <div class="head">
        <h3>这次做得怎么样？</h3>
        <button class="icon-btn" aria-label="关闭" @click="cancel"><Icon name="close" /></button>
      </div>

      <div class="stars">
        <button v-for="n in 5" :key="n" :class="{ on: n <= form.rating }" @click="form.rating = n">★</button>
      </div>

      <label class="field"><span>心得（下次翻开会第一个看到）</span>
        <textarea v-model="form.note" class="input" rows="3" placeholder="比如：盐多了，下次放半小勺；鸡翅多煎一分钟更香"></textarea>
      </label>

      <label class="field"><span>日期</span>
        <input v-model="form.date" type="date" class="input" :max="today" />
      </label>

      <div class="photos">
        <ImagePicker v-for="(id, i) in form.imageIds" :key="id" v-model="form.imageIds[i]" ratio="1" />
        <ImagePicker :model-value="form.pending" ratio="1" label="成品照" @update:model-value="addPhoto" />
      </div>

      <button class="btn" style="width:100%;margin-top:18px" @click="save">记下来</button>
    </div>
  </div>
</template>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: center; }
h3 { margin: 0; font-size: 20px; font-weight: 900; }
.head .icon-btn { background: var(--paper-2); }
.stars { display: flex; gap: 6px; margin: 16px 0 20px; }
.stars button { font-size: 32px; color: var(--line); line-height: 1; transition: transform .1s; }
.stars button.on { color: #d39a1d; }
.stars button:active { transform: scale(1.2); }
.photos { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
</style>
