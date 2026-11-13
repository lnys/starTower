import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

// 构建为单文件 index.html，可直接双击打开（dev 模式不受影响）
export default defineConfig(({ command }) => ({
  base: './',
  plugins: [vue(), ...(command === 'build' ? [viteSingleFile()] : [])],
  build: {
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
  },
}))
