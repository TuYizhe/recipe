<script lang="ts">
  import { parseRoute, type Route } from './lib/route'
  import { app, loadAll } from './lib/store.svelte'
  import HomeView from './lib/components/HomeView.svelte'
  import RecipeView from './lib/components/RecipeView.svelte'
  import CookView from './lib/components/CookView.svelte'
  import EditView from './lib/components/EditView.svelte'
  import ShopView from './lib/components/ShopView.svelte'
  import UpdatePrompt from './lib/components/UpdatePrompt.svelte'

  let route = $state<Route>(parseRoute(location.hash))
  history.scrollRestoration = 'manual'
  const onHash = () => {
    route = parseRoute(location.hash)
    requestAnimationFrame(() => window.scrollTo(0, 0))
  }
  loadAll()
</script>

<svelte:window onhashchange={onHash} />

<UpdatePrompt />

{#if app.loaded}
  {#if route.view === 'home'}
    <HomeView />
  {:else if route.view === 'recipe'}
    {#key route.id}<RecipeView id={route.id} />{/key}
  {:else if route.view === 'cook'}
    <CookView id={route.id} />
  {:else if route.view === 'edit'}
    <EditView id={route.id} />
  {:else if route.view === 'add'}
    {#key route.tag}<EditView tag={route.tag} />{/key}
  {:else if route.view === 'shop'}
    <ShopView />
  {/if}
{/if}

{#if app.toast}<div class="toast">{app.toast}</div>{/if}
