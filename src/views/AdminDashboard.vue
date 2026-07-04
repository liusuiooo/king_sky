<template>
  <div class="admin-dashboard">
    <!-- 顶部管理栏 -->
    <div class="admin-topbar">
      <div class="admin-topbar-left">
        <el-icon :size="22" color="#409eff"><Monitor /></el-icon>
        <h2>管理后台</h2>
      </div>
      <div class="admin-topbar-right">
        <el-tag type="info" effect="plain">
          管理员：{{ adminInfo?.account }}
        </el-tag>
        <el-button size="small" @click="handleLogout">退出管理</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stat-cards">
      <el-card shadow="hover" class="stat-card">
        <div class="stat-card-body">
          <el-icon :size="32" color="#409eff"><User /></el-icon>
          <div class="stat-info">
            <span class="stat-num">{{ users.length }}</span>
            <span class="stat-label">注册账号</span>
          </div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-card-body">
          <el-icon :size="32" color="#e6a23c"><ChatLineSquare /></el-icon>
          <div class="stat-info">
            <span class="stat-num">{{ approvedPosts.length }}</span>
            <span class="stat-label">已审核帖子</span>
          </div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-card-body">
          <el-icon :size="32" color="#f56c6c"><WarningFilled /></el-icon>
          <div class="stat-info">
            <span class="stat-num">{{ pendingPosts.length }}</span>
            <span class="stat-label">待审核帖子</span>
          </div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-card-body">
          <el-icon :size="32" color="#67c23a"><ChatDotSquare /></el-icon>
          <div class="stat-info">
            <span class="stat-num">{{ allReplies.length }}</span>
            <span class="stat-label">评论总数</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 标签页：账号管理 / 帖子审核 -->
    <el-tabs v-model="activeTab" class="admin-tabs">
      <!-- ==================== 标签1：账号管理 ==================== -->
      <el-tab-pane label="账号管理" name="accounts">
        <!-- 搜索筛选 -->
        <div class="admin-toolbar">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索账号ID或昵称..."
            :prefix-icon="Search"
            clearable
            class="search-input"
          />
        </div>

        <!-- 用户列表 -->
        <el-card shadow="never" class="section-card">
          <template #header><span>所有账号列表（点击查看详情）</span></template>

          <el-table
            :data="filteredUsers"
            style="width: 100%"
            stripe
            highlight-current-row
            @row-click="selectUser"
            :row-class-name="tableRowClassName"
          >
            <el-table-column prop="id" label="账号ID" width="120" />
            <el-table-column prop="nickname" label="昵称" min-width="150" />
            <el-table-column label="注册时间" width="180">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="发帖数" width="90" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="userPostCount(row.id) > 0 ? 'primary' : 'info'">
                  {{ userPostCount(row.id) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="评论数" width="90" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="userReplyCount(row.id) > 0 ? 'success' : 'info'">
                  {{ userReplyCount(row.id) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 选中用户的详细内容 -->
        <el-card v-if="selectedUser" shadow="never" class="section-card">
          <template #header>
            <div class="detail-header">
              <span>
                用户详情：<strong>{{ selectedUser.nickname }}</strong>
                <el-tag size="small" type="info" effect="plain" style="margin-left:8px">
                  ID: {{ selectedUser.id }}
                </el-tag>
              </span>
              <el-button text @click="selectedUser = null">关闭</el-button>
            </div>
          </template>

          <div class="detail-section">
            <h4 class="detail-section-title">
              <el-icon><ChatLineSquare /></el-icon> 发布的帖子（{{ userPosts.length }}）
            </h4>
            <el-empty v-if="userPosts.length === 0" description="该用户暂无发帖" />
            <div v-for="post in userPosts" :key="post.id" class="detail-item">
              <div class="detail-item-header">
                <span class="detail-item-title">{{ post.title }}</span>
                <el-tag size="small" type="warning" effect="light">{{ post.sectionName }}</el-tag>
              </div>
              <div class="detail-item-preview">{{ post.content }}</div>
              <div class="detail-item-footer">
                <span>{{ formatDate(post.createdAt) }}</span>
                <span>帖子ID: {{ post.id }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4 class="detail-section-title">
              <el-icon><ChatDotSquare /></el-icon> 发布的评论（{{ userReplies.length }}）
            </h4>
            <el-empty v-if="userReplies.length === 0" description="该用户暂无评论" />
            <div v-for="reply in userReplies" :key="reply.id" class="detail-item">
              <div class="detail-item-content">{{ reply.content }}</div>
              <div class="detail-item-footer">
                <span>回复于 {{ formatDate(reply.createdAt) }}</span>
                <el-tag size="small" effect="plain" type="info">帖子ID: {{ reply.postId }}</el-tag>
                <el-tag v-if="reply.postTitle" size="small" effect="plain" type="primary">
                  帖子: {{ reply.postTitle }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- ==================== 标签2：帖子审核 ==================== -->
      <el-tab-pane label="帖子审核" name="review">
        <!-- 筛选 Tabs -->
        <el-tabs v-model="reviewFilter" type="card" class="review-tabs">
          <el-tab-pane label="待审核" name="pending">
            <el-empty v-if="pendingPosts.length === 0" description="暂无待审核的帖子" />
            <div v-for="post in pendingPosts" :key="post.id" class="review-card">
              <div class="review-card-header">
                <span class="review-card-title">{{ post.title }}</span>
                <el-tag size="small" type="warning" effect="light">{{ post.sectionName }}</el-tag>
              </div>
              <div class="review-card-meta">
                <span>作者：{{ post.authorNickname || '匿名' }}</span>
                <span>账号ID：{{ post.authorId || '-' }}</span>
                <span>{{ formatDate(post.createdAt) }}</span>
              </div>
              <div class="review-card-content">{{ post.content }}</div>
              <div class="review-card-actions">
                <el-button type="success" :icon="Check" @click="approvePost(post)" :loading="approvingId === post.id">
                  通过审核
                </el-button>
                <el-button type="danger" :icon="Close" @click="rejectPost(post)" :loading="rejectingId === post.id">
                  拒绝删除
                </el-button>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="已通过" name="approved">
            <el-empty v-if="approvedPosts.length === 0" description="暂无已通过的帖子" />
            <div v-for="post in approvedPosts" :key="post.id" class="review-card approved">
              <div class="review-card-header">
                <span class="review-card-title">{{ post.title }}</span>
                <el-tag size="small" type="success" effect="light">已通过</el-tag>
              </div>
              <div class="review-card-meta">
                <span>作者：{{ post.authorNickname || '匿名' }}</span>
                <span>账号ID：{{ post.authorId || '-' }}</span>
                <span>{{ formatDate(post.createdAt) }}</span>
              </div>
              <div class="review-card-content review-card-content--clamp">{{ post.content }}</div>
              <div class="review-card-actions">
                <el-button type="danger" size="small" :icon="Delete" @click="deleteApprovedPost(post)">
                  删除
                </el-button>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="已拒绝" name="rejected">
            <el-empty v-if="rejectedPosts.length === 0" description="暂无已拒绝的帖子" />
            <div v-for="post in rejectedPosts" :key="post.id" class="review-card rejected">
              <div class="review-card-header">
                <span class="review-card-title">{{ post.title }}</span>
                <el-tag size="small" type="danger" effect="light">已拒绝</el-tag>
              </div>
              <div class="review-card-meta">
                <span>作者：{{ post.authorNickname || '匿名' }}</span>
                <span>账号ID：{{ post.authorId || '-' }}</span>
                <span>{{ formatDate(post.createdAt) }}</span>
              </div>
              <div class="review-card-content review-card-content--clamp">{{ post.content }}</div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-tab-pane>
    </el-tabs>

    <!-- 未登录提示 -->
    <el-result v-if="!isLoggedIn" icon="warning" title="未登录" sub-title="请先以管理员身份登录">
      <template #extra>
        <el-button type="primary" @click="goLogin">前往登录</el-button>
      </template>
    </el-result>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getItem, setItem } from '../utils/api.js'
import {
  Monitor, User, ChatLineSquare, ChatDotSquare, Search,
  WarningFilled, Check, Close, Delete
} from '@element-plus/icons-vue'

const router = useRouter()

// ---- 管理员登录状态 ----
const adminInfo = ref(null)
const isLoggedIn = ref(false)

// ---- 数据 ----
const users = ref([])
const allPosts = ref([])       // forum_posts — 已审核通过的帖子
const pendingPosts = ref([])   // forum_pending_posts — 待审核帖子
const rejectedPosts = ref([])  // forum_rejected_posts — 被拒绝的帖子
const allReplies = ref([])

// ---- UI 状态 ----
const activeTab = ref('accounts')
const reviewFilter = ref('pending')
const searchKeyword = ref('')
const selectedUser = ref(null)
const approvingId = ref(null)
const rejectingId = ref(null)

// ---- 生命周期 ----
onMounted(async () => {
  try {
    const raw = sessionStorage.getItem('forum_admin')
    if (raw) {
      adminInfo.value = JSON.parse(raw)
      isLoggedIn.value = true
      await loadData()
    } else {
      isLoggedIn.value = false
    }
  } catch {
    isLoggedIn.value = false
  }
})

async function loadData() {
  users.value = (await getItem('forum_users')) || []
  allPosts.value = (await getItem('forum_posts')) || []
  pendingPosts.value = (await getItem('forum_pending_posts')) || []
  rejectedPosts.value = (await getItem('forum_rejected_posts')) || []
  allReplies.value = (await getItem('forum_replies')) || []

  // 为回复关联帖子标题
  const postMap = {}
  ;[...allPosts.value, ...pendingPosts.value, ...rejectedPosts.value].forEach(p => {
    postMap[p.id] = p.title
  })
  allReplies.value.forEach(r => {
    r.postTitle = postMap[r.postId] || '(未知帖子)'
  })
}

// ---- 已审核通过的帖子（供统计用） ----
const approvedPosts = computed(() => allPosts.value)

// ---- 账号管理 ----
const filteredUsers = computed(() => {
  const kw = searchKeyword.value.trim()
  if (!kw) return users.value
  return users.value.filter(u =>
    String(u.id).includes(kw) || (u.nickname && u.nickname.includes(kw))
  )
})

function userPostCount(userId) {
  return allPosts.value.filter(p => String(p.authorId) === String(userId)).length
}

function userReplyCount(userId) {
  return allReplies.value.filter(r => String(r.authorId) === String(userId)).length
}

function selectUser(row) {
  selectedUser.value = row
}

const userPosts = computed(() => {
  if (!selectedUser.value) return []
  return allPosts.value.filter(p => String(p.authorId) === String(selectedUser.value.id))
})

const userReplies = computed(() => {
  if (!selectedUser.value) return []
  return allReplies.value.filter(r => String(r.authorId) === String(selectedUser.value.id))
})

function tableRowClassName({ row }) {
  return selectedUser.value?.id === row.id ? 'current-row' : ''
}

// ---- 帖子审核 ----
async function approvePost(post) {
  approvingId.value = post.id
  try {
    // 从待审核列表移除
    const newPending = pendingPosts.value.filter(p => p.id !== post.id)
    await setItem('forum_pending_posts', newPending)
    pendingPosts.value = newPending

    // 加入已审核帖子（forum_posts）
    const newApproved = [...allPosts.value, post]
    await setItem('forum_posts', newApproved)
    allPosts.value = newApproved
  } catch (e) {
    console.error('审核通过失败:', e)
  }
  approvingId.value = null
}

async function rejectPost(post) {
  rejectingId.value = post.id
  try {
    // 从待审核列表移除
    const newPending = pendingPosts.value.filter(p => p.id !== post.id)
    await setItem('forum_pending_posts', newPending)
    pendingPosts.value = newPending

    // 加入已拒绝列表
    const newRejected = [...rejectedPosts.value, post]
    await setItem('forum_rejected_posts', newRejected)
    rejectedPosts.value = newRejected
  } catch (e) {
    console.error('拒绝帖子失败:', e)
  }
  rejectingId.value = null
}

async function deleteApprovedPost(post) {
  try {
    const newApproved = allPosts.value.filter(p => p.id !== post.id)
    await setItem('forum_posts', newApproved)
    allPosts.value = newApproved
  } catch (e) {
    console.error('删除帖子失败:', e)
  }
}

// ---- 通用 ----
function handleLogout() {
  sessionStorage.removeItem('forum_admin')
  router.replace('/')
}

function goLogin() {
  router.push('/admin/login')
}

function formatDate(isoStr) {
  if (!isoStr) return '-'
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
.admin-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* ===== 顶部栏 ===== */
.admin-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--el-color-primary-light-5, #a0cfff);
}
.admin-topbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.admin-topbar-left h2 {
  margin: 0;
  font-size: 20px;
  color: var(--el-text-color-primary, #303133);
}
.admin-topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* ===== 统计卡片 ===== */
.stat-cards {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}
.stat-card {
  flex: 1;
  border-radius: 10px;
}
.stat-card-body {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 4px 0;
}
.stat-info {
  display: flex;
  flex-direction: column;
}
.stat-num {
  font-size: 28px;
  font-weight: 700;
  color: var(--el-text-color-primary, #303133);
  line-height: 1.2;
}
.stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary, #909399);
}

/* ===== 标签页 ===== */
.admin-tabs {
  margin-top: 0;
}

/* ===== 工具栏 ===== */
.admin-toolbar {
  margin-bottom: 16px;
}
.search-input {
  max-width: 360px;
}

/* ===== 卡片 ===== */
.section-card {
  border-radius: 10px;
  margin-bottom: 20px;
}

/* 表格选中行高亮 */
:deep(.el-table .current-row > td) {
  background-color: var(--el-color-primary-light-9, #ecf5ff) !important;
}

/* ===== 用户详情 ===== */
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.detail-section {
  margin-bottom: 24px;
}
.detail-section:last-child {
  margin-bottom: 0;
}
.detail-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-light, #f0f0f0);
}
.detail-item {
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter, #f0f0f0);
  border-radius: 8px;
  margin-bottom: 10px;
  background: var(--el-fill-color-lighter, #fafafa);
}
.detail-item:last-child {
  margin-bottom: 0;
}
.detail-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.detail-item-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.detail-item-preview {
  font-size: 13px;
  color: var(--el-text-color-secondary, #606266);
  line-height: 1.5;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.detail-item-content {
  font-size: 14px;
  color: var(--el-text-color-regular, #606266);
  line-height: 1.5;
  margin-bottom: 6px;
}
.detail-item-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--el-text-color-placeholder, #c0c4cc);
}

/* ===== 帖子审核卡片 ===== */
.review-tabs {
  margin-bottom: 16px;
}
.review-card {
  padding: 16px;
  border: 1px solid var(--el-border-color-light, #e4e7ed);
  border-radius: 10px;
  margin-bottom: 14px;
  background: #fff;
  transition: box-shadow 0.2s;
}
.review-card:hover {
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.review-card.approved {
  border-left: 4px solid var(--el-color-success, #67c23a);
}
.review-card.rejected {
  border-left: 4px solid var(--el-color-danger, #f56c6c);
  opacity: 0.7;
}
.review-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.review-card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.review-card-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary, #909399);
  margin-bottom: 10px;
}
.review-card-content {
  font-size: 14px;
  color: var(--el-text-color-regular, #606266);
  line-height: 1.6;
  margin-bottom: 12px;
  white-space: pre-wrap;
}
.review-card-content--clamp {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.review-card-actions {
  display: flex;
  gap: 10px;
}
</style>
