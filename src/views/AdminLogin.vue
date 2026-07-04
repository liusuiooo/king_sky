<template>
  <div class="admin-login">
    <el-card shadow="always" class="admin-login-card">
      <div class="admin-login-header">
        <el-icon :size="40" color="#409eff"><Monitor /></el-icon>
        <h2>管理员登录</h2>
      </div>

      <el-form @submit.prevent="handleLogin" label-position="top">
        <el-form-item label="管理员账号">
          <el-input
            v-model="form.account"
            placeholder="请输入管理员账号"
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
            :prefix-icon="Lock"
          />
        </el-form-item>
        <el-alert
          v-if="errorMsg"
          :title="errorMsg"
          type="error"
          :closable="false"
          show-icon
          class="form-alert"
        />
        <el-form-item>
          <el-button type="primary" native-type="submit" class="form-btn">
            <el-icon><Monitor /></el-icon>
            进入管理后台
          </el-button>
        </el-form-item>
      </el-form>

      <div class="form-footer">
        <el-button text @click="goBack">← 返回首页</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, Monitor } from '@element-plus/icons-vue'

const router = useRouter()

const form = ref({ account: '', password: '' })
const errorMsg = ref('')

// 固定管理员账号密码
const ADMIN_ACCOUNT = 'admin'
const ADMIN_PASSWORD = '123456'

const handleLogin = () => {
  errorMsg.value = ''
  const { account, password } = form.value

  if (!account || !password) {
    errorMsg.value = '请填写管理员账号和密码'
    return
  }

  if (account !== ADMIN_ACCOUNT) {
    errorMsg.value = '管理员账号不存在'
    return
  }

  if (password !== ADMIN_PASSWORD) {
    errorMsg.value = '密码错误'
    return
  }

  // 登录成功，将管理员信息存入 session（页面关闭即失效）
  sessionStorage.setItem('forum_admin', JSON.stringify({
    account: ADMIN_ACCOUNT,
    loginTime: new Date().toISOString()
  }))

  router.replace('/admin/dashboard')
}

const goBack = () => {
  router.replace('/')
}
</script>

<style scoped>
.admin-login {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 20px;
}

.admin-login-card {
  width: 100%;
  max-width: 420px;
  border-radius: 12px;
}

.admin-login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.admin-login-header h2 {
  margin: 0;
  font-size: 22px;
  color: var(--el-text-color-primary, #303133);
}

.form-alert {
  margin-bottom: 16px;
}

.form-btn {
  width: 100%;
  margin-top: 4px;
}

.form-footer {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}
</style>
