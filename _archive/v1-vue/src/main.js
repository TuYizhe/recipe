import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import './styles/base.css'
import { loadSettings, requestPersist } from './db'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('./views/Home.vue') },
    { path: '/recipe/new', name: 'new', component: () => import('./views/RecipeEdit.vue') },
    { path: '/recipe/:id', name: 'recipe', component: () => import('./views/RecipeDetail.vue') },
    { path: '/recipe/:id/edit', name: 'edit', component: () => import('./views/RecipeEdit.vue') },
    { path: '/shopping', name: 'shopping', component: () => import('./views/Shopping.vue') },
    { path: '/settings', name: 'settings', component: () => import('./views/Settings.vue') }
  ],
  scrollBehavior: () => ({ top: 0 })
})

loadSettings().then(() => {
  createApp(App).use(router).mount('#app')
  requestPersist() // 请求浏览器不要自动清理本地数据
})
