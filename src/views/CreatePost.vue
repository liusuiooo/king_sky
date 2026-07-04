<template>
  <div class="create-post">
    <!-- 导航栏 -->
    <div class="page-header">
      <el-button @click="goBack" :icon="ArrowLeft">返回</el-button>
      <h1>发表帖子</h1>
    </div>

    <el-card shadow="never" class="form-body">
      <el-form label-position="top">
        <!-- 帖子标题 -->
        <el-form-item label="帖子标题">
          <el-input
            v-model="title"
            placeholder="请输入标题（限26字）..."
            maxlength="26"
            show-word-limit
          />
        </el-form-item>

        <!-- 正文内容 -->
        <el-form-item label="正文内容">
          <el-input
            v-model="content"
            type="textarea"
            :rows="6"
            placeholder="写下你想分享的内容..."
          />
        </el-form-item>

        <!-- 文件上传 -->
        <el-form-item label="上传文件（txt / pdf / docx）">
          <el-upload
            ref="fileUploadRef"
            :auto-upload="false"
            :show-file-list="true"
            :on-change="handleFileChange"
            :file-list="fileList"
            :multiple="true"
            drag
            accept=".txt,.pdf,.docx,.doc"
          >
            <div class="upload-area-content">
              <el-icon class="upload-icon"><UploadFilled /></el-icon>
              <div class="upload-text">点击选择文件 或 拖拽文件到此区域</div>
            </div>
          </el-upload>
        </el-form-item>

        <!-- 图片上传 -->
        <el-form-item label="上传图片">
          <el-upload
            ref="imageUploadRef"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleImageChange"
            :multiple="true"
            list-type="picture-card"
            accept="image/*"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>

          <!-- 图片预览与样式设置 -->
          <div v-if="images.length > 0" class="image-gallery">
            <div v-for="(img, index) in images" :key="index" class="image-card">
              <div class="image-preview-wrap">
                <el-image
                  :src="img.dataUrl"
                  :style="{
                    width: img.style.size + 'px',
                    borderRadius: img.style.radius + 'px',
                    border: img.style.border
                  }"
                  fit="contain"
                  class="preview-img"
                />
                <el-button
                  class="image-remove-btn"
                  type="danger"
                  :icon="Delete"
                  circle
                  size="small"
                  @click="removeImage(index)"
                />
              </div>
              <!-- 单张图片样式控制 -->
              <div class="image-style-controls">
                <div class="style-row">
                  <span class="style-label">尺寸</span>
                  <el-radio-group v-model="img.style.size" size="small">
                    <el-radio-button :value="100">小</el-radio-button>
                    <el-radio-button :value="200">中</el-radio-button>
                    <el-radio-button :value="300">大</el-radio-button>
                  </el-radio-group>
                </div>
                <div class="style-row">
                  <span class="style-label">圆角</span>
                  <el-slider
                    v-model="img.style.radius"
                    :min="0"
                    :max="20"
                    :show-tooltip="false"
                    class="style-slider"
                  />
                  <span class="style-value">{{ img.style.radius }}px</span>
                </div>
                <div class="style-row">
                  <span class="style-label">边框</span>
                  <el-radio-group v-model="img.style.border" size="small">
                    <el-radio-button value="none">无</el-radio-button>
                    <el-radio-button value="1px solid #ddd">实线</el-radio-button>
                    <el-radio-button value="1px dashed #999">虚线</el-radio-button>
                  </el-radio-group>
                </div>
              </div>
            </div>
          </div>
        </el-form-item>

        <!-- 发布按钮 -->
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="submit-btn"
            :disabled="!title.trim()"
            @click="submitPost"
          >
            发布帖子
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getItem, setItem } from '../utils/api.js'
import { ArrowLeft, UploadFilled, Plus, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

const title = ref('')
const content = ref('')
const fileList = ref([])
const fileData = ref([])  // 存储实际文件内容
const images = ref([])
const fileUploadRef = ref(null)
const imageUploadRef = ref(null)

// 文件选择处理
const handleFileChange = async (uploadFile) => {
  const rawFile = uploadFile.raw
  if (!rawFile) return

  const dataUrl = await readFileAsDataUrl(rawFile)
  const existingIdx = fileData.value.findIndex(f => f.name === rawFile.name)
  if (existingIdx === -1) {
    fileData.value.push({
      name: rawFile.name,
      size: rawFile.size,
      type: rawFile.type,
      dataUrl: dataUrl
    })
  }
}

// 图片选择处理
const handleImageChange = async (uploadFile) => {
  const rawFile = uploadFile.raw
  if (!rawFile) return

  const dataUrl = await readFileAsDataUrl(rawFile)
  images.value.push({
    dataUrl: dataUrl,
    style: {
      size: 200,
      radius: 4,
      border: 'none'
    }
  })
}

// 移除图片
const removeImage = (index) => {
  images.value.splice(index, 1)
}

// 用FileReader读取文件内容为dataUrl
const readFileAsDataUrl = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}

// 板块名称 → URL slug 映射
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

// 提交帖子（存到待审核列表）
const submitPost = async () => {
  if (!title.value.trim()) return

  const currentUser = await getItem('forum_current_user')

  const post = {
    id: Date.now(),
    title: title.value.trim(),
    content: content.value.trim(),
    files: fileData.value.map(f => ({ name: f.name, size: f.size, type: f.type, dataUrl: f.dataUrl })),
    images: images.value.map(img => ({
      dataUrl: img.dataUrl,
      style: { ...img.style }
    })),
    sectionName: route.query.name || '网文江湖',
    authorId: currentUser ? currentUser.id : null,
    authorNickname: currentUser ? currentUser.nickname : '匿名',
    authorAvatar: currentUser ? currentUser.avatar : null,
    createdAt: new Date().toISOString()
  }

  try {
    // 新帖子存入待审核列表，管理员通过后才可见
    const pending = (await getItem('forum_pending_posts')) || []
    pending.unshift(post)
    await setItem('forum_pending_posts', pending)
  } catch (e) {
    alert('存储空间不足，无法发布帖子。请清理一些旧帖子或图片后再试。')
    return
  }

  // 提示用户帖子已提交审核
  ElMessage.success('帖子已提交，等待管理员审核通过后即可显示')
  setTimeout(() => {
    const sectionName = route.query.name || '网文江湖'
    const slug = sectionSlugs[sectionName] || 'wenxue'
    router.replace({
      path: `/forum/${slug}`,
      query: { name: sectionName }
    })
  }, 1500)
}

// 返回板块详情页
const goBack = () => {
  const sectionName = route.query.name || '网文江湖'
  const slug = sectionSlugs[sectionName] || 'wenxue'
  router.replace({
    path: `/forum/${slug}`,
    query: { name: sectionName }
  })
}
</script>

<style scoped>
.create-post {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 8px 8px;
}

/* ===== 导航栏 ===== */
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

/* ===== 表单主体 ===== */
.form-body {
  border-radius: 12px;
}

.upload-area-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-icon {
  font-size: 32px;
  color: var(--el-text-color-placeholder, #c0c4cc);
}

.upload-text {
  font-size: 14px;
  color: var(--el-text-color-secondary, #909399);
}

/* ===== 图片画廊 ===== */
.image-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
}

.image-card {
  background: var(--el-fill-color-light, #f9f9f9);
  border: 1px solid var(--el-border-color-light, #eee);
  border-radius: 10px;
  padding: 12px;
  width: calc(50% - 8px);
  min-width: 280px;
  box-sizing: border-box;
}

.image-preview-wrap {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 120px;
  margin-bottom: 12px;
}

.preview-img {
  max-width: 100%;
  transition: all 0.3s ease;
}

.image-remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
}

/* 图片样式控制 */
.image-style-controls {
  border-top: 1px solid var(--el-border-color-light, #eee);
  padding-top: 10px;
}

.style-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.style-row:last-child {
  margin-bottom: 0;
}

.style-label {
  font-size: 13px;
  color: var(--el-text-color-secondary, #909399);
  min-width: 36px;
  flex-shrink: 0;
}

.style-slider {
  flex: 1;
  max-width: 200px;
}

.style-value {
  font-size: 12px;
  color: var(--el-text-color-placeholder, #c0c4cc);
  min-width: 32px;
}

/* ===== 发布按钮 ===== */
.submit-btn {
  width: 100%;
  margin-top: 8px;
}
</style>
