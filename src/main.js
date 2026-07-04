import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import './style.css'
import App from './App.vue'
import router from './router'

// ============================================
// Mock.js 拦截器 — 模拟后端 API 接口
// 注释掉下一行以切换到真实后端
// ============================================
import './utils/mockService.js'

// API 数据访问层（基于 Axios，请求被 Mock.js 拦截）
// 如需切回 IndexedDB，将 api.js 改为 storage.js 即可
import { getItem, setItem } from './utils/api.js'

// 应用启动
const app = createApp(App)

// 注册 Element Plus
app.use(ElementPlus)

// 全局注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(router)
app.mount('#app')

// 开发调试：在控制台查看模拟数据
console.log('[main] Element Plus + Mock.js API 模式已启动')
getItem('forum_posts').then(posts => {
  console.log(`[main] 已加载 ${posts?.length || 0} 条帖子`)
})
