import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { defineNuxtModule, addVitePlugin, addWebpackPlugin, isNuxt2, requireModule } from '@nuxt/kit'
import consola from 'consola'
// import type { Nuxt } from '@nuxt/schema'
import type { Options as WebpackPlugin } from 'stylelint-webpack-plugin'
import type { Options as VitePlugin } from 'vite-plugin-stylelint'
import { name, version } from '../package.json'

export interface ModuleOptions {
  vite: VitePlugin,
  webpack: WebpackPlugin
  builder?: 'vite' | 'webpack'
}

const logger = consola.withScope('nuxt:stylelint')

const resolveBuilder = (options: ModuleOptions, nuxt: any) => {
  let builder = options.builder

  if (!builder) {
    switch (nuxt.options.builder) {
      case '@nuxt/vite-bluider':
      case 'vite':
        builder = 'vite'
        break
      case '@nuxt/webpack-bluider':
      case 'webpack':
        builder = 'webpack'
        break
      default:
        builder = 'vite'
        break
    }
  }

  return builder
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: 'stylelint'
  },
  defaults: nuxt => ({
    vite: {
      stylelintPath: 'stylelint',
      cache: true,
      fix: false,
      include: [
        './**/*.css',
        './**/*.sass',
        './**/*.scss',
        './**/*.less',
        './**/*.stylus',
        './**/*.vue'
      ],
      emitWarning: true,
      emitError: true
    },
    webpack: {
      context: nuxt.options.srcDir,
      stylelintPath: 'stylelint',
      extensions: ['css', 'sass', 'scss', 'less', 'stylus', 'vue'],
      cache: true,
      lintDirtyModulesOnly: true
    }
  }),
  async setup (options, nuxt) {
    const builder = resolveBuilder(options, nuxt)
    const stylelintPath = (builder === 'webpack' ? options.webpack.stylelintPath : options.vite.stylelintPath) || 'stylelint'

    try {
      requireModule(stylelintPath)
    } catch {
      logger.warn(
        `The dependency \`${stylelintPath}\` not found.`,
        'Please run `yarn add stylelint --dev` or `npm install stylelint --save-dev`'
      )
      return
    }

    const filesToWatch = [
      '.stylelintignore',
      '.stylelintrc',
      '.stylelintrc.json',
      '.stylelintrc.yaml',
      '.stylelintrc.yml',
      '.stylelintrc.js',
      'stylelint.config.js'
    ]

    if (isNuxt2()) {
      nuxt.options.watch = nuxt.options.watch || []
      nuxt.options.watch.push(
        ...filesToWatch.map(file => resolve(nuxt.options.rootDir, file))
      )
    } else {
      nuxt.hook('builder:watch', async (event, path) => {
        if (event !== 'change' && filesToWatch.includes(path)) {
          await nuxt.callHook('builder:generateApp')
        }
      })
    }

    if (builder === 'vite') {
      const vitePluginStylelint = require('vite-plugin-stylelint').default

      // See https://github.com/nuxt/framework/pull/5560
      nuxt.hook('vite:extendConfig', (config, { isClient, isServer }) => {
        if (isServer) {
          return
        }

        config.plugins = config.plugins || []
        config.plugins.push(vitePluginStylelint(options.vite))
      })

      // return addVitePlugin(vitePluginStylelint(options.vite), {
      //   server: false
      // })
    }

    if (builder === 'webpack') {
      const StylelintWebpackPlugin = require('stylelint-webpack-plugin')

      return addWebpackPlugin(new StylelintWebpackPlugin(options.webpack), {
        server: false
      })
    }
  }
})
