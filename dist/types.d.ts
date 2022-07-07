
import { ModuleOptions } from './module'

declare module '@nuxt/schema' {
  interface NuxtConfig { ['stylelint']?: Partial<ModuleOptions> }
  interface NuxtOptions { ['stylelint']?: ModuleOptions }
}


export { default } from './module'
