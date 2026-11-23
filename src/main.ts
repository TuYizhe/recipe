import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import { initPwaUpdates } from './lib/pwa.svelte'

initPwaUpdates()

export default mount(App, { target: document.getElementById('app')! })
