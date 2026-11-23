<script setup>
import { toast } from './toast'
</script>

<template>
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <keep-alive include="Home">
        <component :is="Component" />
      </keep-alive>
    </transition>
  </router-view>
  <transition name="fade"><div v-if="toast.text" class="toast">{{ toast.text }}</div></transition>
</template>

<style>
.fade-enter-active, .fade-leave-active { transition: opacity .18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
