import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// 暂时注释掉性能监控相关导入和初始化
// import { initPerformanceMonitoring } from './services/performance'
import { initErrorTracking } from './services/errorTracking'

// 注册 Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful')
      })
      .catch(err => {
        console.log('ServiceWorker registration failed: ', err)
      })
  })
}

// 暂时注释掉性能监控初始化
// initPerformanceMonitoring()
initErrorTracking()

// 预加载关键图片
const criticalImages = [
  '/images/logo.svg',
  '/images/hero-image.jpg',
]
import { preloadImages } from './utils/performance'
preloadImages(criticalImages)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
) 