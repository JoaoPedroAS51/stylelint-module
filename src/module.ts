import { resolve } from 'path'
import {
  defineNuxtModule,
  addVitePlugin,
  addWebpackPlugin,
  isNuxt2,
  resolveModule,
  requireModule,
  useLogger
} from '@nuxt/kit'
import type { Options as WebpackPlugin } from 'stylelint-webpack-plugin'
import type { Options as VitePlugin } from 'vite-plugin-stylelint'
import { name, version } from '../package.json'

type Builder = '@nuxt/vite-builder' | '@nuxt/webpack-builder'
export interface ModuleOptions {
  vite: VitePlugin,
  webpack: WebpackPlugin
}

const logger = useLogger('nuxt:stylelint')

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
  setup (options, nuxt) {
    const stylelintPath =  (nuxt.options.builder as Builder) === '@nuxt/webpack-builder'
      ? options.webpack.stylelintPath || 'eslint'
      : 'stylelint'

    try {
      resolveModule(stylelintPath)
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

    if ((nuxt.options.builder as Builder) === '@nuxt/vite-builder') {
      const vitePluginStylelint = requireModule('vite-plugin-stylelint')

      return addVitePlugin(vitePluginStylelint(options.vite), {
        server: false
      })
    } else if ((nuxt.options.builder as Builder) === '@nuxt/webpack-builder') {
      const StylelintWebpackPlugin = requireModule('stylelint-webpack-plugin')

      return addWebpackPlugin(new StylelintWebpackPlugin(options.webpack), {
        server: false
      })
    } else {
      logger.warn(`Builder ${nuxt.options.builder} not supported.`)
    }
  }
})
