// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
import prettierConfig from 'eslint-config-prettier';

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  prettierConfig,
]);
