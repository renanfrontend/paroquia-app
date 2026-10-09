module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: { es2020: true, node: true, browser: true },
  ignorePatterns: ['node_modules/', 'dist/', 'android/', 'ios/'],
  rules: { '@typescript-eslint/no-explicit-any': 'warn' },
};
