import { resolve } from 'path';
import { useLogger, defineNuxtModule, resolveModule, isNuxt2, requireModule, addVitePlugin, addWebpackPlugin } from '@nuxt/kit';

const name = "@nuxtjs/stylelint-module";
const version = "4.1.0";

const logger = useLogger("nuxt:stylelint");
const module = defineNuxtModule({
  meta: {
    name,
    version,
    configKey: "stylelint"
  },
  defaults: (nuxt) => ({
    vite: {
      stylelintPath: "stylelint",
      cache: true,
      fix: false,
      include: [
        "./**/*.css",
        "./**/*.sass",
        "./**/*.scss",
        "./**/*.less",
        "./**/*.stylus",
        "./**/*.vue"
      ],
      emitWarning: true,
      emitError: true
    },
    webpack: {
      context: nuxt.options.srcDir,
      stylelintPath: "stylelint",
      extensions: ["css", "sass", "scss", "less", "stylus", "vue"],
      cache: true,
      lintDirtyModulesOnly: true
    }
  }),
  setup(options, nuxt) {
    const stylelintPath = nuxt.options.builder === "@nuxt/webpack-builder" ? options.webpack.stylelintPath || "eslint" : "stylelint";
    try {
      resolveModule(stylelintPath);
    } catch {
      logger.warn(
        `The dependency \`${stylelintPath}\` not found.`,
        "Please run `yarn add stylelint --dev` or `npm install stylelint --save-dev`"
      );
      return;
    }
    const filesToWatch = [
      ".stylelintignore",
      ".stylelintrc",
      ".stylelintrc.json",
      ".stylelintrc.yaml",
      ".stylelintrc.yml",
      ".stylelintrc.js",
      "stylelint.config.js"
    ];
    if (isNuxt2()) {
      nuxt.options.watch = nuxt.options.watch || [];
      nuxt.options.watch.push(
        ...filesToWatch.map((file) => resolve(nuxt.options.rootDir, file))
      );
    } else {
      nuxt.hook("builder:watch", async (event, path) => {
        if (event !== "change" && filesToWatch.includes(path)) {
          await nuxt.callHook("builder:generateApp");
        }
      });
    }
    if (nuxt.options.builder === "@nuxt/vite-builder") {
      const vitePluginStylelint = requireModule("vite-plugin-stylelint");
      return addVitePlugin(vitePluginStylelint(options.vite), {
        server: false
      });
    } else if (nuxt.options.builder === "@nuxt/webpack-builder") {
      const StylelintWebpackPlugin = requireModule("stylelint-webpack-plugin");
      return addWebpackPlugin(new StylelintWebpackPlugin(options.webpack), {
        server: false
      });
    } else {
      logger.warn(`Builder ${nuxt.options.builder} not supported.`);
    }
  }
});

export { module as default };
