<template>
  <div class="post-detail">
    <div class="page-header">
      <el-button @click="goBack" :icon="ArrowLeft">返回</el-button>
      <h1>帖子详情</h1>
    </div>

    <div v-if="post" class="detail-body">
      <h2 class="detail-title">{{ post.title }}</h2>

      <!-- 发布人信息 -->
      <div class="detail-author-row">
        <el-avatar :size="32" :src="post.authorAvatar" icon="UserFilled" />
        <span class="detail-author-name">{{ post.authorNickname || '匿名' }}</span>
      </div>

      <div class="detail-meta">
        <el-tag type="primary" size="small" effect="light">{{ post.sectionName }}</el-tag>
        <span class="detail-time">{{ formatTime(post.createdAt) }}</span>
      </div>

      <!-- 点赞 & 统计 -->
      <div class="post-stats-bar">
        <el-button
          :type="userLiked ? 'danger' : 'default'"
          :icon="userLiked ? null : null"
          :class="{ liked: userLiked }"
          @click="toggleLike"
          :disabled="!currentUser"
          plain
          size="small"
        >
          👍 {{ likeCount }}
        </el-button>
        <span class="stats-divider">·</span>
        <span class="stats-reply">💬 {{ replies.length }} 条回复</span>
      </div>

      <div class="detail-content">{{ post.content }}</div>

      <!-- 全部图片 -->
      <div v-if="post.images && post.images.length > 0" class="detail-section-block">
        <h4 class="detail-subtitle">图片 ({{ post.images.length }}张)</h4>
        <div class="detail-image-grid">
          <el-image
            v-for="(img, i) in post.images"
            :key="i"
            :src="img.dataUrl"
            :style="{
              width: img.style.size + 'px',
              borderRadius: img.style.radius + 'px',
              border: img.style.border
            }"
            :preview-src-list="previewList"
            :initial-index="i"
            fit="cover"
            class="detail-img"
            hide-on-click-modal
          />
        </div>
      </div>

      <!-- 全部文件 -->
      <div v-if="post.files && post.files.length > 0" class="detail-section-block">
        <h4 class="detail-subtitle">附件 ({{ post.files.length }}个)</h4>
        <div
          v-for="(f, i) in post.files"
          :key="i"
          class="detail-file-item"
          :class="{ 'has-data': f.dataUrl }"
          @click="downloadFile(f)"
        >
          <span class="detail-file-icon">{{ fileIcon(f.name) }}</span>
          <span class="detail-file-name">{{ f.name }}</span>
          <span class="detail-file-size">{{ formatFileSize(f.size) }}</span>
          <el-tag v-if="f.dataUrl" type="primary" size="small" effect="light">⬇ 下载</el-tag>
        </div>
      </div>

      <!-- ====== 回复区 ====== -->
      <div class="reply-section">
        <div class="reply-actions">
          <el-button
            :type="showReplyInput ? 'default' : 'primary'"
            size="small"
            @click="toggleReplyInput"
          >
            {{ showReplyInput ? '取消回复' : '💬 回复' }}
          </el-button>
          <span class="reply-count">{{ replies.length }} 条回复</span>
        </div>

        <!-- 回复输入框 -->
        <div v-if="showReplyInput" class="reply-input-area">
          <div v-if="replyToNickname" class="reply-nest-hint">
            回复 @{{ replyToNickname }}
            <el-button text size="small" type="primary" @click="cancelNestReply">取消</el-button>
          </div>
          <el-input
            v-model="replyContent"
            type="textarea"
            :rows="3"
            :placeholder="replyToNickname ? '写下你的回复...' : '写下你的回复...'"
            class="reply-textarea"
          />
          <div class="reply-input-footer">
            <span v-if="!currentUser" class="reply-login-tip">
              请先<el-link type="primary" @click="goLogin">登录</el-link>后回复
            </span>
            <el-button
              type="primary"
              size="small"
              :disabled="!replyContent.trim() || !currentUser"
              @click="submitReply"
            >
              发表回复
            </el-button>
          </div>
        </div>

        <!-- 回复列表 -->
        <div v-if="replies.length > 0" class="reply-list">
          <div
            v-for="(reply, index) in replies"
            :key="reply.id"
            class="reply-item"
          >
            <div class="reply-header">
              <el-tag type="primary" size="small" effect="light" class="reply-floor-tag">
                {{ floorText(index) }}
              </el-tag>
              <div class="reply-author" @click="goToUser(reply.authorId)">
                <el-avatar :size="24" :src="reply.authorAvatar" icon="UserFilled" />
                <span class="reply-nickname">{{ reply.authorNickname || '匿名' }}</span>
              </div>
              <span class="reply-time">{{ formatTime(reply.createdAt) }}</span>
            </div>
            <div class="reply-content">
              <div class="reply-text">
                <span v-if="reply.parentAuthorNickname" class="reply-at">回复 @{{ reply.parentAuthorNickname }}: </span>
                {{ reply.content }}
              </div>
              <div class="reply-content-footer">
                <el-button text size="small" type="primary" @click="replyToReply(reply)">回复</el-button>
              </div>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无回复，快来抢沙发吧～" />
      </div>
    </div>

    <el-empty v-else description="帖子不存在或已被删除">
      <el-button @click="goBack" :icon="ArrowLeft">返回列表</el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getItem, setItem } from '../utils/api.js'
import { ArrowLeft, UserFilled } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const post = ref(null)

// ---------- 点赞 ----------
const likeCount = ref(0)
const userLiked = ref(false)

const loadLikes = async () => {
  const postId = Number(route.params.postId)
  const allLikes = (await getItem('forum_likes')) || []
  likeCount.value = allLikes.filter(l => l.postId === postId).length
  if (currentUser.value) {
    userLiked.value = allLikes.some(l => l.postId === postId && l.userId === currentUser.value.id)
  }
}

const toggleLike = async () => {
  if (!currentUser.value) return
  const postId = Number(route.params.postId)
  let allLikes = (await getItem('forum_likes')) || []
  const idx = allLikes.findIndex(l => l.postId === postId && l.userId === currentUser.value.id)
  if (idx === -1) {
    allLikes.push({ postId, userId: currentUser.value.id })
    userLiked.value = true
    likeCount.value++
    if (post.value && post.value.authorId !== currentUser.value.id) {
      await createNotification('like', postId, currentUser.value.id, currentUser.value.nickname, post.value.authorId, post.value.title)
    }
  } else {
    allLikes.splice(idx, 1)
    userLiked.value = false
    likeCount.value--
  }
  await setItem('forum_likes', allLikes)
}

// ---------- 回复 ----------
const replies = ref([])
const replyContent = ref('')
const showReplyInput = ref(false)
const currentUser = ref(null)
const replyToId = ref(null)
const replyToNickname = ref('')

const toggleReplyInput = () => {
  showReplyInput.value = !showReplyInput.value
  if (!showReplyInput.value) {
    cancelNestReply()
  }
}

const replyToReply = (reply) => {
  replyToId.value = reply.id
  replyToNickname.value = reply.authorNickname || '匿名'
  showReplyInput.value = true
}

const cancelNestReply = () => {
  replyToId.value = null
  replyToNickname.value = ''
}

const loadReplies = async () => {
  const allReplies = (await getItem('forum_replies')) || []
  const postId = Number(route.params.postId)
  replies.value = allReplies
    .filter(r => r.postId === postId)
    .sort((a, b) => a.createdAt - b.createdAt)
}

const submitReply = async () => {
  const text = replyContent.value.trim()
  if (!text || !currentUser.value) return

  const newReply = {
    id: Date.now(),
    postId: Number(route.params.postId),
    content: text,
    authorId: currentUser.value.id,
    authorNickname: currentUser.value.nickname,
    authorAvatar: currentUser.value.avatar || null,
    parentReplyId: replyToId.value,
    parentAuthorNickname: replyToNickname.value || null,
    createdAt: Date.now()
  }

  try {
    const allReplies = (await getItem('forum_replies')) || []
    allReplies.push(newReply)
    await setItem('forum_replies', allReplies)

    if (post.value && post.value.authorId !== currentUser.value.id) {
      await createNotification('reply', newReply.postId, currentUser.value.id, currentUser.value.nickname, post.value.authorId, post.value.title)
    }

    if (replyToId.value && post.value) {
      const parentReply = allReplies.find(r => r.id === replyToId.value)
      if (parentReply && parentReply.authorId !== currentUser.value.id && parentReply.authorId !== post.value.authorId) {
        await createNotification('nested_reply', newReply.postId, currentUser.value.id, currentUser.value.nickname, parentReply.authorId, post.value.title)
      }
    }

    replyContent.value = ''
    showReplyInput.value = false
    cancelNestReply()
    await loadReplies()
  } catch (e) {
    alert('保存回复失败，请检查存储空间是否充足。' + (e.message ? ' (' + e.message + ')' : ''))
  }
}

const floorText = (index) => {
  const num = index + 1
  const chineseNums = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  if (num <= 10) return chineseNums[num - 1] + '楼'
  return num + '楼'
}

// ---------- 图片预览 ----------
const previewList = computed(() => {
  if (!post.value || !post.value.images) return []
  return post.value.images.map(img => img.dataUrl)
})

// ---------- 通知 ----------
const createNotification = async (type, postId, fromUserId, fromNickname, targetUserId, postTitle) => {
  if (fromUserId === targetUserId) return

  if (type === 'like') {
    const all = (await getItem('forum_notifications')) || []
    const exists = all.some(n =>
      n.type === 'like' &&
      n.postId === postId &&
      n.fromUserId === fromUserId &&
      n.targetUserId === targetUserId
    )
    if (exists) return
  }

  const newNotif = {
    id: Date.now(),
    type,
    postId,
    postTitle: postTitle || '未知帖子',
    fromUserId,
    fromNickname: fromNickname || '匿名',
    targetUserId,
    createdAt: Date.now(),
    read: false
  }

  const all = (await getItem('forum_notifications')) || []
  all.push(newNotif)
  await setItem('forum_notifications', all)
}

// ---------- 生命周期 ----------
onMounted(async () => {
  const postId = Number(route.params.postId)
  const allPosts = (await getItem('forum_posts')) || []
  post.value = allPosts.find(p => p.id === postId) || null
  currentUser.value = await getItem('forum_current_user')
  await loadReplies()
  await loadLikes()
})

// ---------- 工具函数 ----------
const formatTime = (isoStr) => {
  const date = new Date(isoStr)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
}

const fileIcon = (name) => {
  const ext = name.split('.').pop().toLowerCase()
  if (ext === 'pdf') return '📄'
  if (ext === 'docx' || ext === 'doc') return '📝'
  if (ext === 'txt') return '📃'
  return '📎'
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
}

const goToUser = (userId) => {
  router.push(`/user/${userId}`)
}

const goLogin = () => {
  router.push('/login')
}

const goBack = () => {
  const sectionName = route.query.name || '网文江湖'
  const sectionSlugs = {
    '网文江湖': 'wenxue',
    '太极八卦': 'bagua',
    '前沿科技': 'keji',
    '游戏天堂': 'game',
    '业界招聘': 'zhaopin',
    '体育竞技': 'tiyu',
    '历史文化': 'lishi',
    '动漫在线': 'dongman'
  }
  const slug = sectionSlugs[sectionName] || 'wenxue'
  router.replace({
    path: `/forum/${slug}`,
    query: { name: sectionName }
  })
}
</script>

<style scoped>
.post-detail {
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

/* ---------- 发布人信息 ---------- */
.detail-author-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.detail-author-name {
  font-size: 14px;
  color: var(--el-text-color-regular, #606266);
}

.detail-body {
  background: #fff;
  border: 1px solid var(--el-border-color-light, #eee);
  border-radius: 12px;
  padding: 28px 24px;
}

.detail-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary, #303133);
  margin-bottom: 12px;
  margin-top: 0;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter, #f0f0f0);
}

.detail-time {
  font-size: 13px;
  color: var(--el-text-color-placeholder, #c0c4cc);
}

.detail-content {
  font-size: 16px;
  color: var(--el-text-color-regular, #606266);
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: 24px;
  text-align: left;
}

.detail-section-block {
  margin-bottom: 24px;
}

.detail-subtitle {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter, #f0f0f0);
  margin-top: 0;
}

.detail-image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.detail-img {
  object-fit: cover;
  transition: all 0.3s ease;
  cursor: pointer;
}

.detail-file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--el-fill-color-light, #f9f9f9);
  border: 1px solid var(--el-border-color-lighter, #f0f0f0);
  border-radius: 8px;
  margin-bottom: 8px;
  transition: background 0.2s, border-color 0.2s;
}

.detail-file-item.has-data {
  cursor: pointer;
}

.detail-file-item.has-data:hover {
  background: var(--el-color-primary-light-9, #f0f5ff);
  border-color: var(--el-color-primary, #409eff);
}

.detail-file-icon {
  font-size: 20px;
}

.detail-file-name {
  flex: 1;
  font-size: 15px;
  color: var(--el-text-color-primary, #303133);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-file-size {
  font-size: 13px;
  color: var(--el-text-color-secondary, #909399);
}

/* ---------- 点赞统计栏 ---------- */
.post-stats-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter, #f0f0f0);
}

.stats-divider {
  color: var(--el-border-color, #dcdfe6);
  font-size: 14px;
}

.stats-reply {
  font-size: 13px;
  color: var(--el-text-color-secondary, #909399);
}

/* ---------- 回复区 ---------- */
.reply-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--el-border-color-light, #eee);
}

.reply-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.reply-count {
  font-size: 13px;
  color: var(--el-text-color-secondary, #909399);
}

.reply-input-area {
  background: var(--el-fill-color-light, #f9f9f9);
  border: 1px solid var(--el-border-color-light, #eee);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.reply-input-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.reply-login-tip {
  font-size: 13px;
  color: var(--el-text-color-secondary, #909399);
}

.reply-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.reply-item {
  padding: 14px 0;
  border-bottom: 1px solid var(--el-border-color-lighter, #f0f0f0);
}

.reply-item:last-child {
  border-bottom: none;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.reply-author {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.reply-author:hover {
  opacity: 0.7;
}

.reply-nickname {
  font-size: 14px;
  color: var(--el-color-primary, #409eff);
  font-weight: 500;
}

.reply-time {
  font-size: 12px;
  color: var(--el-text-color-placeholder, #c0c4cc);
  margin-left: auto;
  flex-shrink: 0;
}

.reply-content {
  font-size: 15px;
  color: var(--el-text-color-regular, #606266);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  text-align: left;
  background: #fff;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 8px;
  padding: 10px 14px;
  margin-top: 8px;
}

.reply-text {
  line-height: 1.6;
}

.reply-at {
  color: var(--el-color-primary, #409eff);
  font-weight: 500;
}

.reply-content-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid var(--el-border-color-lighter, #f0f0f0);
}

.reply-nest-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--el-color-primary, #409eff);
  margin-bottom: 8px;
  padding: 6px 10px;
  background: var(--el-color-primary-light-9, #f0f5ff);
  border-radius: 4px;
}
</style>
