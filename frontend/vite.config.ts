import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
  },
  build: {
    // 关闭类型检查
    typescript: {
      ignoreBuildErrors: true,
    },
    // 关闭 ESLint 校验
    rollupOptions: {
      onwarn(warning, warn) {
        // 忽略所有警告
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        if (warning.code.includes('ESLINT')) return;
        if (warning.code === 'TS_ERROR') return;
        
        // 使用默认的警告处理
        warn(warning);
      }
    }
  }
}) 