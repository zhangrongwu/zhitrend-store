import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initErrorTracking } from './services/errorTracking'

// 注册 Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .catch(err => {
        console.log('ServiceWorker registration failed: ', err)
      })
  })
}

// 初始化错误跟踪
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