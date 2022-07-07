import { defineNuxtConfig } from 'nuxt'
// import viteStylelintPlugin from 'vite-plugin-stylelint'
import stylelintModule from '..'

export default defineNuxtConfig({
  modules: [
    stylelintModule
  ],
  vite: {
    // plugins: [viteStylelintPlugin()]
  }
})
