<!-- App.vue - 应用入口文件 -->
<template>
  <div id="app">
    <!-- 顶部导航栏 -->
    <el-header class="app-header">
      <div class="header-left">
        <span class="logo" @click="goHome">论坛</span>
      </div>
      <div class="header-center">
        <el-button text class="header-admin" @click="goAdminLogin">
          <el-icon><Monitor /></el-icon>
          <span>管理员</span>
        </el-button>
      </div>
      <div class="header-right">
        <template v-if="currentUser">
          <el-badge :value="unreadCount" :max="99" class="header-notif-wrapper" @click="goNotifications">
            <el-button :icon="Bell" circle size="small" />
          </el-badge>
          <el-button text class="header-user" @click="goMyAccount">
            {{ currentUser.nickname || '我的' }}
          </el-button>
        </template>
        <el-button v-else text class="header-user" @click="goLogin">我的</el-button>
      </div>
    </el-header>
    <!-- 页面内容 -->
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getItem } from './utils/api.js'
import { Bell, Monitor } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const currentUser = ref(null)
const unreadCount = ref(0)

// 计算未读数
const calcUnread = async () => {
  const user = currentUser.value
  if (!user) {
    unreadCount.value = 0
    return
  }
  const all = (await getItem('forum_notifications')) || []
  unreadCount.value = all.filter(n => n.targetUserId === user.id && !n.read).length
}

// 每次页面挂载时检查登录状态
onMounted(async () => {
  await checkLogin()
  await calcUnread()
})

// 监听路由变化时重新检查
watch(() => route.path, async () => {
  await checkLogin()
  await calcUnread()
})

const checkLogin = async () => {
  currentUser.value = await getItem('forum_current_user')
}

const goHome = () => {
  router.push('/')
}

const goLogin = () => {
  router.push('/login')
}

const goMyAccount = () => {
  router.push('/my-account')
}

const goNotifications = () => {
  router.push('/notifications')
}

const goAdminLogin = () => {
  router.push('/admin/login')
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 顶部导航栏 */
.app-header {
  width: 100%;
  max-width: 1200px;
  align-self: center;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid var(--el-border-color-light, #eee);
  height: auto !important;
}

.header-left .logo {
  font-size: 20px;
  font-weight: 700;
  color: var(--el-color-primary, #409eff);
  cursor: pointer;
  user-select: none;
}

.header-center {
  display: flex;
  align-items: center;
}

.header-admin {
  font-size: 14px;
  color: var(--el-text-color-secondary, #606266);
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.2s;
}
.header-admin:hover {
  color: var(--el-color-primary, #409eff);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-notif-wrapper {
  cursor: pointer;
}

/* 主内容区 — 全宽 */
.app-main {
  width: 100%;
  flex: 1;
}
</style>
