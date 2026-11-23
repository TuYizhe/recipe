<script lang="ts">
  import { updateState, applyUpdate, dismissUpdate } from '../pwa.svelte'
</script>

{#if updateState.available}
  <div class="tip" role="status">
    <span>有新版本了</span>
    <button class="go" onclick={applyUpdate}>更新</button>
    <button onclick={dismissUpdate} aria-label="稍后">✕</button>
  </div>
{/if}

<style>
  .tip {
    position: fixed; z-index: 90; left: 50%; transform: translateX(-50%); top: calc(64px + var(--safe-top));
    display: flex; align-items: center; gap: 14px; padding: 10px 14px 10px 20px; border-radius: 999px;
    background: var(--ink); color: var(--paper); font-size: 14px;
  }
  .go { padding: 4px 14px; border-radius: 999px; background: var(--paper); color: var(--ink); font-weight: 600; }
</style>
