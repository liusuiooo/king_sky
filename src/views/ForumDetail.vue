<template>
  <div class="forum-detail">
    <!-- 导航栏 -->
    <div class="page-header">
      <el-button @click="goBack" :icon="ArrowLeft">返回</el-button>
      <h1>{{ sectionName }}板块</h1>
    </div>

    <!-- 板块 Hero 区域 -->
    <el-card shadow="never" class="section-hero">
      <div class="hero-title">{{ sectionName }}</div>
      <div class="hero-stats">
        <span>帖子 {{ formatNumber(postCount) }}</span>
        <span class="stat-separator">·</span>
        <span>粉丝 {{ formatNumber(followerCount) }}</span>
      </div>
      <div class="hero-actions">
        <el-button
          :type="isFollowed ? 'default' : 'primary'"
          :icon="isFollowed ? null : Plus"
          @click="toggleFollow"
        >
          {{ isFollowed ? '已关注' : '关注' }}
        </el-button>
        <el-button type="primary" :icon="Edit" @click="goCreatePost">
          发表帖子
        </el-button>
      </div>
    </el-card>

    <!-- 帖子列表 -->
    <el-card shadow="never" class="section-body">
      <template #header>
        <span class="post-list-title">帖子列表</span>
      </template>

      <el-empty v-if="posts.length === 0" description="暂无帖子，点击上方发表帖子按钮发布第一条帖子" />

      <div
        v-for="post in posts"
        :key="post.id"
        class="post-card"
        @click="goPostDetail(post.id)"
      >
        <div class="post-header">
          <span class="post-title">{{ post.title }}</span>
          <el-tag type="info" size="small" effect="plain">
            {{ formatTime(post.createdAt) }}
          </el-tag>
        </div>
        <div class="post-author-row">
          <span class="post-author">{{ post.authorNickname || '匿名' }}</span>
        </div>
        <div class="post-stats-row">
          <span class="post-stat">👍 {{ getLikeCount(post.id) }}</span>
          <span class="post-stat">💬 {{ getReplyCount(post.id) }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getItem } from '../utils/api.js'
import { ArrowLeft, Plus, Edit } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const sectionName = computed(() => route.query.name || '板块')

// 帖子列表
const posts = ref([])

// 点赞计数映射 { postId: count }
const likeCountMap = reactive({})
// 回复计数映射 { postId: count }
const replyCountMap = reactive({})

// 全量数据缓存（避免重复读取）
let allPostsCache = []
let allLikesCache = []
let allRepliesCache = []

// 加载所有数据
const loadAllData = async () => {
  const [allPosts, allLikes, allReplies] = await Promise.all([
    getItem('forum_posts'),
    getItem('forum_likes'),
    getItem('forum_replies')
  ])
  allPostsCache = allPosts || []
  allLikesCache = allLikes || []
  allRepliesCache = allReplies || []

  // 只显示当前板块的帖子
  const sectionPosts = allPostsCache.filter(p => p.sectionName === sectionName.value)
  posts.value = sectionPosts

  // 更新板块统计数据
  postCount.value = sectionPosts.length
  followerCount.value = Math.floor(sectionPosts.length * 0.8) + Math.floor(Math.random() * 100)

  // 构建点赞计数映射
  sectionPosts.forEach(post => {
    likeCountMap[post.id] = allLikesCache.filter(l => l.postId === post.id).length
    replyCountMap[post.id] = allRepliesCache.filter(r => r.postId === post.id).length
  })
}

onMounted(() => {
  loadAllData()
})

// 监听路由变化（板块切换时重新加载帖子）
watch(() => route.fullPath, () => {
  loadAllData()
})

// 获取帖子点赞数（同步读取已缓存的映射）
const getLikeCount = (postId) => {
  return likeCountMap[postId] || 0
}

// 获取帖子回复数（同步读取已缓存的映射）
const getReplyCount = (postId) => {
  return replyCountMap[postId] || 0
}

// 板块统计
const postCount = ref(0)
const followerCount = ref(0)
const isFollowed = ref(false)

// 跳转到帖子详情页
const goPostDetail = (postId) => {
  router.push({
    path: `/forum/post/${postId}`,
    query: { name: sectionName.value }
  })
}

// 数字格式化
const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toLocaleString()
}

// 时间格式化
const formatTime = (isoStr) => {
  const date = new Date(isoStr)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
}

// 关注/取消关注
const toggleFollow = () => {
  isFollowed.value = !isFollowed.value
}

// 返回论坛首页
const goBack = () => {
  router.replace('/')
}

// 跳转发帖页面
const goCreatePost = () => {
  router.push({
    path: '/forum/create',
    query: { name: sectionName.value }
  })
}
</script>

<style scoped>
.forum-detail {
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
}

/* ===== 板块 Hero 区域 ===== */
.section-hero {
  margin-bottom: 16px;
  border-radius: 12px;
}

.hero-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--el-text-color-primary, #303133);
  margin-bottom: 8px;
}

.hero-stats {
  font-size: 14px;
  color: var(--el-text-color-secondary, #909399);
  margin-bottom: 20px;
}

.stat-separator {
  margin: 0 8px;
}

.hero-actions {
  display: flex;
  gap: 12px;
}

/* ===== 帖子列表区域 ===== */
.section-body {
  border-radius: 12px;
}

.post-list-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
}

/* 帖子卡片 */
.post-card {
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter, #f0f0f0);
  border-radius: 8px;
  margin-bottom: 10px;
  background: var(--el-fill-color-light, #fafafa);
  transition: box-shadow 0.2s;
  cursor: pointer;
}

.post-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.post-card:last-child {
  margin-bottom: 0;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.post-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
}

.post-author-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.post-author {
  font-size: 13px;
  color: var(--el-text-color-secondary, #909399);
}

.post-stats-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
}

.post-stat {
  font-size: 12px;
  color: var(--el-text-color-placeholder, #c0c4cc);
}
</style>
