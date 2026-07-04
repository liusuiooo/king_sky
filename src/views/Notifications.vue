<template>
  <div class="notifications-page">
    <div class="page-header">
      <el-button @click="goBack" :icon="ArrowLeft">返回</el-button>
      <h1>消息通知</h1>
      <el-button
        v-if="unreadCount > 0"
        text
        type="primary"
        size="small"
        @click="markAllRead"
      >
        全部标为已读
      </el-button>
    </div>

    <el-empty v-if="notifications.length === 0" description="暂无消息通知" />

    <div v-else class="notification-list">
      <div
        v-for="notif in notifications"
        :key="notif.id"
        class="notification-item"
        :class="{ unread: !notif.read }"
        @click="goToPost(notif)"
      >
        <el-avatar :size="40" icon="UserFilled" />
        <div class="notif-body">
          <div class="notif-text">
            <span class="notif-nickname">{{ notif.fromNickname || '匿名' }}</span>
            <span class="notif-action">{{ actionText(notif.type) }}</span>
          </div>
          <div class="notif-post-title">《{{ notif.postTitle }}》</div>
          <div class="notif-time">{{ formatTime(notif.createdAt) }}</div>
        </div>
        <el-badge v-if="!notif.read" is-dot class="notif-dot" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getItem, setItem } from '../utils/api.js'
import { ArrowLeft, UserFilled } from '@element-plus/icons-vue'

const router = useRouter()

const notifications = ref([])

const loadNotifications = async () => {
  const currentUser = await getItem('forum_current_user')
  if (!currentUser) {
    notifications.value = []
    return
  }
  const all = (await getItem('forum_notifications')) || []
  notifications.value = all
    .filter(n => n.targetUserId === currentUser.id)
    .sort((a, b) => b.createdAt - a.createdAt)
}

const unreadCount = ref(0)

const computeUnread = () => {
  unreadCount.value = notifications.value.filter(n => !n.read).length
}

onMounted(async () => {
  await loadNotifications()
  computeUnread()
})

const actionText = (type) => {
  const map = {
    'reply': '回复了你的帖子',
    'nested_reply': '回复了你的回复',
    'like': '赞了你的帖子'
  }
  return map[type] || '与你互动'
}

const formatTime = (ts) => {
  const date = new Date(ts)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
}

const goToPost = async (notif) => {
  await markAsRead(notif.id)
  router.push({
    path: `/forum/wenxue/post/${notif.postId}`,
    query: { name: '' }
  })
}

const markAsRead = async (notifId) => {
  const all = (await getItem('forum_notifications')) || []
  const idx = all.findIndex(n => n.id === notifId)
  if (idx !== -1) {
    all[idx].read = true
    await setItem('forum_notifications', all)
  }
  const localIdx = notifications.value.findIndex(n => n.id === notifId)
  if (localIdx !== -1) {
    notifications.value[localIdx].read = true
  }
  computeUnread()
}

const markAllRead = async () => {
  const currentUser = await getItem('forum_current_user')
  if (!currentUser) return
  const all = (await getItem('forum_notifications')) || []
  let changed = false
  all.forEach(n => {
    if (n.targetUserId === currentUser.id && !n.read) {
      n.read = true
      changed = true
    }
  })
  if (changed) {
    await setItem('forum_notifications', all)
  }
  notifications.value.forEach(n => { n.read = true })
  unreadCount.value = 0
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.notifications-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 8px 8px;
}

/* ===== 顶部导航栏 ===== */
.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0 12px;
  border-bottom: 1px solid var(--el-border-color-light, #eee);
  margin-bottom: 16px;
}

.page-header h1 {
  font-size: 20px;
  color: var(--el-text-color-primary, #303133);
  margin: 0;
  flex: 1;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid var(--el-border-color-lighter, #f0f0f0);
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}

.notification-item:hover {
  background: var(--el-fill-color-light, #fafafa);
}

.notification-item.unread {
  background: var(--el-color-primary-light-9, #f0f5ff);
  border-color: var(--el-color-primary-light-7, #d6e4ff);
}

.notification-item.unread:hover {
  background: var(--el-color-primary-light-8, #e6f0ff);
}

.notif-body {
  flex: 1;
  min-width: 0;
}

.notif-text {
  font-size: 14px;
  color: var(--el-text-color-primary, #303133);
  line-height: 1.5;
}

.notif-nickname {
  font-weight: 600;
  color: var(--el-color-primary, #409eff);
}

.notif-action {
  color: var(--el-text-color-regular, #606266);
}

.notif-post-title {
  font-size: 13px;
  color: var(--el-text-color-secondary, #909399);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notif-time {
  font-size: 12px;
  color: var(--el-text-color-placeholder, #c0c4cc);
  margin-top: 4px;
}

.notif-dot {
  margin-top: 8px;
  flex-shrink: 0;
}
</style>
