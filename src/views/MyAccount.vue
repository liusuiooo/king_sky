<template>
  <div class="my-account">
    <!-- 查看其他用户 -->
    <template v-if="isViewingOther">
      <el-card shadow="never" class="section">
        <template #header>
          <span class="section-title">用户信息</span>
        </template>
        <div class="profile-body">
          <el-avatar :size="64" :src="viewUser.avatar">
            <span class="avatar-emoji">😊</span>
          </el-avatar>
          <div class="profile-detail">
            <div class="profile-nickname">{{ viewUser.nickname }}</div>
            <div class="profile-id">账号：{{ viewUser.id }}</div>
            <div class="profile-stats">帖子 {{ myPosts.length }}</div>
          </div>
        </div>
      </el-card>

      <el-card shadow="never" class="section">
        <template #header>
          <span class="section-title">TA 的帖子</span>
        </template>
        <el-empty v-if="myPosts.length === 0" description="该用户还没有发布过帖子" />
        <div v-else class="post-list">
          <div
            v-for="post in myPosts"
            :key="post.id"
            class="post-item"
            @click="goPostDetail(post.id)"
          >
            <div class="post-header">
              <span class="post-title">{{ truncate(post.title, 26) }}</span>
              <el-tag type="primary" size="small" effect="light">{{ post.sectionName }}</el-tag>
            </div>
            <div class="post-preview">{{ truncate(post.content, 100) }}</div>
            <div class="post-meta">
              <span>{{ formatTime(post.createdAt) }}</span>
              <span>{{ post.images ? post.images.length : 0 }} 图 · {{ post.files ? post.files.length : 0 }} 文件</span>
            </div>
          </div>
        </div>
      </el-card>

      <el-button class="back-btn" @click="goBack" :icon="ArrowLeft">返回</el-button>
    </template>

    <!-- 未登录 -->
    <template v-else-if="!user">
      <el-card shadow="always" class="unlogin-card">
        <p class="unlogin-text">您尚未登录</p>
        <el-button type="primary" size="large" @click="goLogin" class="unlogin-btn">
          前往登录
        </el-button>
        <div class="back-link">
          <el-button text @click="goBack">← 返回首页</el-button>
        </div>
      </el-card>
    </template>

    <!-- 已登录 -->
    <template v-else>
      <!-- 账号信息 -->
      <el-card shadow="never" class="section">
        <template #header>
          <span class="section-title">账号信息</span>
        </template>
        <div class="profile-body">
          <div class="avatar-wrapper">
            <el-avatar :size="64" :src="user.avatar">
              <span class="avatar-emoji">😊</span>
            </el-avatar>
            <el-button
              class="avatar-btn"
              :icon="Camera"
              circle
              size="small"
              type="primary"
              @click="triggerAvatarInput"
            />
            <input
              ref="avatarInput"
              type="file"
              accept="image/*"
              style="display:none"
              @change="handleAvatarUpload"
            />
          </div>
          <div class="profile-detail">
            <div class="profile-nickname">{{ user.nickname }}</div>
            <div class="profile-id">账号：{{ user.id }}</div>
            <div class="profile-stats">帖子 {{ myPosts.length }}</div>
          </div>
          <el-button type="danger" @click="handleLogout">退出登录</el-button>
        </div>
      </el-card>

      <!-- 我的帖子 -->
      <el-card shadow="never" class="section">
        <template #header>
          <span class="section-title">我的帖子</span>
        </template>
        <el-empty v-if="myPosts.length === 0" description="还没有发布过帖子" />
        <div v-else class="post-list">
          <div
            v-for="post in myPosts"
            :key="post.id"
            class="post-item"
            @click="goPostDetail(post.id)"
          >
            <div class="post-header">
              <span class="post-title">{{ truncate(post.title, 26) }}</span>
              <el-tag type="primary" size="small" effect="light">{{ post.sectionName }}</el-tag>
            </div>
            <div class="post-preview">{{ truncate(post.content, 100) }}</div>
            <div class="post-meta">
              <span>{{ formatTime(post.createdAt) }}</span>
              <span>{{ post.images ? post.images.length : 0 }} 图 · {{ post.files ? post.files.length : 0 }} 文件</span>
            </div>
          </div>
        </div>
      </el-card>

      <el-button class="back-btn" @click="goBack" :icon="ArrowLeft">返回首页</el-button>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getItem, setItem, removeItem } from '../utils/api.js'
import { ArrowLeft, Camera } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const user = ref(null)
const myPosts = ref([])
const avatarInput = ref(null)
const viewUser = ref(null)

const isViewingOther = computed(() => {
  return !!route.params.userId
})

onMounted(async () => {
  if (route.params.userId) {
    const userId = Number(route.params.userId)
    const users = (await getItem('forum_users')) || []
    const found = users.find(u => u.id === userId)
    if (found) {
      viewUser.value = found
      await loadMyPosts(userId)
    }
  } else {
    user.value = await getItem('forum_current_user')
    if (user.value) {
      await loadMyPosts(user.value.id)
    }
  }
})

const loadMyPosts = async (userId) => {
  const allPosts = (await getItem('forum_posts')) || []
  myPosts.value = allPosts.filter(p => p.authorId === userId)
}

// ---------- 头像上传 ----------
const triggerAvatarInput = () => {
  avatarInput.value.click()
}

const handleAvatarUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = async (event) => {
    const dataUrl = event.target.result
    user.value.avatar = dataUrl

    const current = await getItem('forum_current_user')
    if (current) {
      current.avatar = dataUrl
      await setItem('forum_current_user', current)
    }

    const users = (await getItem('forum_users')) || []
    const idx = users.findIndex(u => u.id === user.value.id)
    if (idx !== -1) {
      users[idx].avatar = dataUrl
      await setItem('forum_users', users)
    }
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

// ---------- 退出登录 ----------
const handleLogout = async () => {
  await removeItem('forum_current_user')
  router.replace('/')
}

const goLogin = () => {
  router.replace('/login')
}

const goBack = () => {
  if (route.params.userId) {
    router.back()
  } else {
    router.replace('/')
  }
}

const goPostDetail = (postId) => {
  router.push(`/forum/wenxue/post/${postId}`)
}

const truncate = (text, max) => {
  if (!text) return ''
  return text.length > max ? text.slice(0, max) + '...' : text
}

const formatTime = (isoStr) => {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}
</script>

<style scoped>
.my-account {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 20px;
  min-height: 80vh;
}

/* ---------- 未登录 ---------- */
.unlogin-card {
  width: 100%;
  max-width: 420px;
  text-align: center;
  margin-top: 40px;
  border-radius: 12px;
}

.unlogin-text {
  font-size: 16px;
  color: var(--el-text-color-secondary, #909399);
  margin-bottom: 20px;
}

.unlogin-btn {
  width: 100%;
  margin-bottom: 12px;
}

.back-link {
  text-align: center;
}

/* ---------- 通用 section 卡片 ---------- */
.section {
  width: 100%;
  max-width: 680px;
  border-radius: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
}

/* ---------- 账号信息 ---------- */
.profile-body {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.avatar-btn {
  position: absolute;
  bottom: -2px;
  right: -2px;
}

.avatar-emoji {
  font-size: 28px;
  line-height: 1;
}

.profile-detail {
  flex: 1;
  min-width: 0;
}

.profile-nickname {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
}

.profile-id {
  font-size: 13px;
  color: var(--el-text-color-secondary, #909399);
  margin-top: 2px;
}

.profile-stats {
  font-size: 13px;
  color: var(--el-text-color-regular, #606266);
  margin-top: 4px;
}

/* ---------- 我的帖子 ---------- */
.post-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.post-item {
  padding: 14px 16px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter, #f0f0f0);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.post-item:hover {
  background: var(--el-fill-color-light, #fafafa);
  border-color: var(--el-border-color, #dcdfe6);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.post-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--el-text-color-primary, #303133);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-preview {
  font-size: 13px;
  color: var(--el-text-color-secondary, #909399);
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--el-text-color-placeholder, #c0c4cc);
  margin-top: 6px;
}

/* ---------- 返回按钮 ---------- */
.back-btn {
  max-width: 680px;
  width: 100%;
}
</style>
