import { reactive } from 'vue'
export const toast = reactive({ text: '' })
let timer
export function showToast(text, ms = 1800) {
  toast.text = text
  clearTimeout(timer)
  timer = setTimeout(() => (toast.text = ''), ms)
}
