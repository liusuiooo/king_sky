<!-- Forum.vue - 论坛首页组件 -->
<template>
  <div class="forum-container">
    <!-- 顶部标签栏 -->
    <el-tabs v-model="activeTab" class="forum-tabs">
      <el-tab-pane label="版块" name="版块">
        <!-- 版块列表 -->
        <div class="section-list">
          <el-card
            v-for="section in sections"
            :key="section.name"
            shadow="hover"
            class="section-card"
            @click="gotoSection(section.name)"
          >
            <div class="section-card-body">
              <el-image
                :src="section.icon"
                class="section-icon"
                fit="cover"
              />
              <div class="section-content">
                <div class="section-title">
                  {{ section.name }}
                  <el-tag
                    v-if="dailyCounts[section.name] > 0"
                    type="warning"
                    size="small"
                    effect="plain"
                  >
                    +{{ dailyCounts[section.name] }}
                  </el-tag>
                </div>
                <div class="section-desc">{{ section.desc }}</div>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <el-tab-pane label="动态" name="动态">
        <!-- 动态：24小时内全板块帖子 -->
        <div class="activity-list">
          <div class="activity-header">
            <span class="activity-title">🔥 近期动态</span>
            <el-tag type="info" size="small" effect="plain">
              {{ recentPosts.length }} 条新帖
            </el-tag>
          </div>

          <el-empty v-if="recentPosts.length === 0" description="24小时内暂无新帖" />

          <div
            v-for="post in recentPosts"
            :key="post.id"
            class="activity-card"
            @click="goToPost(post)"
          >
            <div class="activity-card-top">
              <span class="activity-card-title">{{ post.title }}</span>
              <el-tag type="primary" size="small" effect="light">
                {{ post.sectionName }}
              </el-tag>
            </div>
            <div class="activity-card-bottom">
              <span class="activity-card-author">{{ post.authorNickname || '匿名' }}</span>
              <span class="activity-card-time">{{ formatTime(post.createdAt) }}</span>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getItem } from '../utils/api.js'

const activeTab = ref('版块')
const router = useRouter()

// 板块数据
const sections = [
  { name: '网文江湖', icon: 'https://picsum.photos/80/80?random=1', desc: '好看的网文层出不穷，分享你喜欢的网文~~~' },
  { name: '太极八卦', icon: 'https://picsum.photos/80/80?random=2', desc: '吸星大法，收纳天下八卦' },
  { name: '前沿科技', icon: 'https://picsum.photos/80/80?random=3', desc: '机器学习、深度学习、NLP、CV、AIGC等前沿技术讨论与资源分享' },
  { name: '游戏天堂', icon: 'https://picsum.photos/80/80?random=4', desc: '单机、主机、手游、电竞，游戏同好交流攻略与心得' },
  { name: '业界招聘', icon: 'https://picsum.photos/80/80?random=5', desc: '面经分享、招聘信息、职业规划、行业动态' },
  { name: '体育竞技', icon: 'https://picsum.photos/80/80?random=6', desc: '足球、篮球、跑步、健身，运动爱好者的聚集地' },
  { name: '历史文化', icon: 'https://picsum.photos/80/80?random=7', desc: '古今中外、文史哲艺，探索人类文明的足迹' },
  { name: '动漫在线', icon: 'https://picsum.photos/80/80?random=8', desc: '新番推荐、经典回顾、二次元同好交流乐园' }
]

// 各板块昨日新增帖子数量
const dailyCounts = ref({})

// 动态：24小时内全板块帖子
const recentPosts = ref([])

// 计算各板块最近24小时内新增帖子数
async function updateDailyCounts() {
  try {
    const allPosts = (await getItem('forum_posts')) || []
    const now = Date.now()
    const oneDayAgo = now - 24 * 60 * 60 * 1000

    const counts = {}
    sections.forEach(s => { counts[s.name] = 0 })
    allPosts.forEach(post => {
      if (post.createdAt) {
        const postTime = new Date(post.createdAt).getTime()
        if (postTime >= oneDayAgo && counts.hasOwnProperty(post.sectionName)) {
          counts[post.sectionName]++
        }
      }
    })
    dailyCounts.value = counts
  } catch (e) {
    console.error('计算每日新增帖子数失败:', e)
    dailyCounts.value = {}
  }
}

// 加载24小时内全板块帖子，按时间倒序
async function loadRecentPosts() {
  try {
    const allPosts = (await getItem('forum_posts')) || []
    const now = Date.now()
    const oneDayAgo = now - 24 * 60 * 60 * 1000

    recentPosts.value = allPosts
      .filter(post => {
        if (!post.createdAt) return false
        const postTime = new Date(post.createdAt).getTime()
        return postTime >= oneDayAgo
      })
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  } catch (e) {
    console.error('加载动态失败:', e)
    recentPosts.value = []
  }
}

// 监听标签切换，切到动态时加载帖子
watch(activeTab, (val) => {
  if (val === '动态') {
    loadRecentPosts()
  }
})

// 挂载时计算一次
onMounted(() => {
  updateDailyCounts()
})

const gotoSection = (sectionName) => {
  const routeMap = {
    '网文江湖': '/forum/wenxue',
    '太极八卦': '/forum/bagua',
    '前沿科技': '/forum/keji',
    '游戏天堂': '/forum/game',
    '业界招聘': '/forum/zhaopin',
    '体育竞技': '/forum/tiyu',
    '历史文化': '/forum/lishi',
    '动漫在线': '/forum/dongman',
  }
  router.push({
    path: routeMap[sectionName],
    query: { name: sectionName }
  })
}

// 跳转帖子详情
const goToPost = (post) => {
  router.push({
    path: `/forum/post/${post.id}`,
    query: { name: post.sectionName }
  })
}

// 时间格式化
const formatTime = (isoStr) => {
  const date = new Date(isoStr)
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${min}`
}
</script>

<style scoped>
.forum-container {
  width: 100%;
  max-width: 1200px;       /* 与 header 宽度保持一致 */
  margin: 0 auto;
  background-color: #fff;
  border: 1px solid var(--el-border-color-light, #eee);
  min-height: 300px;
}

/* 让 tabs header 与内容区域的左右边距保持一致 */
.forum-tabs {
  padding: 0;
}
.forum-tabs :deep(.el-tabs__header) {
  padding: 0 20px;          /* 与 header padding 一致 */
  margin: 0;
}
.forum-tabs :deep(.el-tabs__nav-wrap) {
  padding: 0;
}
.forum-tabs :deep(.el-tabs__content) {
  padding: 0;
}

/* 版块列表 */
.section-list {
  padding: 8px 20px;        /* 与 header padding 一致 */
}

.section-card {
  margin-bottom: 8px;
  cursor: pointer;
  border-radius: 8px;
}

.section-card-body {
  display: flex;
  align-items: center;
  gap: 16px;
}

.section-icon {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  flex-shrink: 0;
}

.section-content {
  flex: 1;
  min-width: 0;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.section-desc {
  font-size: 14px;
  color: var(--el-text-color-secondary, #909399);
  line-height: 1.5;
}

/* ---------- 动态：24小时帖子流 ---------- */
.activity-list {
  padding: 8px 0;
}

.activity-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px 8px;   /* 与 header padding 一致 */
  border-bottom: 1px solid var(--el-border-color-light, #f0f0f0);
  margin-bottom: 0;
}

.activity-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
}

.activity-card {
  padding: 14px 20px;       /* 与 header padding 一致 */
  border-bottom: 1px solid var(--el-border-color-lighter, #f5f5f5);
  cursor: pointer;
  transition: background 0.2s;
}

.activity-card:hover {
  background: var(--el-fill-color-light, #fafafa);
}

.activity-card:last-child {
  border-bottom: none;
}

.activity-card-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.activity-card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-card-bottom {
  display: flex;
  align-items: center;
  gap: 12px;
}

.activity-card-author {
  font-size: 13px;
  color: var(--el-text-color-secondary, #909399);
}

.activity-card-time {
  font-size: 12px;
  color: var(--el-text-color-placeholder, #c0c4cc);
  margin-left: auto;
}
</style>
