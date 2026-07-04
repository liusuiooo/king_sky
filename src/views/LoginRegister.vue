<template>
  <div class="login-register">
    <el-card shadow="always" class="login-card">
      <!-- 标题 & 模式切换 -->
      <el-tabs v-model="mode" class="login-tabs" :stretch="true">
        <el-tab-pane label="登录" name="login">
          <el-form @submit.prevent="handleLogin" label-position="top">
            <el-form-item label="账号">
              <el-input
                v-model="loginForm.account"
                placeholder="请输入账号"
              />
            </el-form-item>
            <el-form-item label="密码">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                show-password
              />
            </el-form-item>
            <el-alert
              v-if="loginError"
              :title="loginError"
              type="error"
              :closable="false"
              show-icon
              class="form-alert"
            />
            <el-form-item>
              <el-button type="primary" native-type="submit" class="form-btn">
                登 录
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="注册" name="register">
          <el-form @submit.prevent="handleRegister" label-position="top">
            <el-form-item label="账号（自动分配）">
              <el-input
                :model-value="String(autoAccount)"
                disabled
                placeholder="注册后自动分配"
              />
            </el-form-item>
            <el-form-item label="密码">
              <el-input
                v-model="registerForm.password"
                type="password"
                placeholder="字母 + 数字，不含符号"
                show-password
                @input="validatePassword"
              />
            </el-form-item>
            <el-form-item label="确认密码">
              <el-input
                v-model="registerForm.confirmPassword"
                type="password"
                placeholder="再次输入密码"
                show-password
              />
            </el-form-item>
            <el-form-item label="昵称">
              <el-input
                v-model="registerForm.nickname"
                placeholder="1~100 个字符"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>
            <el-alert
              v-if="registerError"
              :title="registerError"
              type="error"
              :closable="false"
              show-icon
              class="form-alert"
            />
            <el-alert
              v-if="registerSuccess"
              :title="registerSuccess"
              type="success"
              :closable="false"
              show-icon
              class="form-alert"
            />
            <el-form-item>
              <el-button type="primary" native-type="submit" class="form-btn">
                注 册
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <!-- 返回 -->
      <div class="form-footer">
        <el-button text @click="goBack">← 返回首页</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getItem, setItem } from '../utils/api.js'

const router = useRouter()

const mode = ref('login')

// ---------- 登录 ----------
const loginForm = ref({ account: '', password: '' })
const loginError = ref('')

const handleLogin = async () => {
  loginError.value = ''
  const { account, password } = loginForm.value
  if (!account || !password) {
    loginError.value = '请填写账号和密码'
    return
  }

  const users = (await getItem('forum_users')) || []
  const user = users.find(u => String(u.id) === String(account))

  if (!user) {
    loginError.value = '账号不存在'
    return
  }
  if (user.password !== password) {
    loginError.value = '密码错误'
    return
  }

  await setItem('forum_current_user', {
    id: user.id,
    nickname: user.nickname
  })

  router.replace('/')
}

// ---------- 注册 ----------
const registerForm = ref({
  password: '',
  confirmPassword: '',
  nickname: ''
})
const registerError = ref('')
const registerSuccess = ref('')
const autoAccount = ref(10000)

onMounted(async () => {
  const users = (await getItem('forum_users')) || []
  if (users.length === 0) {
    autoAccount.value = 10000
  } else {
    const maxId = Math.max(...users.map(u => u.id))
    autoAccount.value = maxId + 1
  }
})

const validatePassword = () => {
  registerForm.value.password = registerForm.value.password.replace(/[^a-zA-Z0-9]/g, '')
}

const handleRegister = async () => {
  registerError.value = ''
  registerSuccess.value = ''

  const { password, confirmPassword, nickname } = registerForm.value

  if (!password) {
    registerError.value = '请输入密码'
    return
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    registerError.value = '密码必须同时包含字母和数字'
    return
  }
  if (/[^a-zA-Z0-9]/.test(password)) {
    registerError.value = '密码不能包含符号'
    return
  }
  if (password !== confirmPassword) {
    registerError.value = '两次密码输入不一致'
    return
  }
  if (!nickname.trim()) {
    registerError.value = '请输入昵称'
    return
  }
  if (nickname.trim().length > 100) {
    registerError.value = '昵称不能超过 100 个字符'
    return
  }

  const users = (await getItem('forum_users')) || []
  let newId = 10000
  if (users.length > 0) {
    newId = Math.max(...users.map(u => u.id)) + 1
  }
  autoAccount.value = newId

  const newUser = {
    id: newId,
    password,
    nickname: nickname.trim(),
    createdAt: new Date().toISOString()
  }
  users.push(newUser)
  await setItem('forum_users', users)

  await setItem('forum_current_user', {
    id: newUser.id,
    nickname: newUser.nickname
  })

  registerSuccess.value = `注册成功！您的账号为 ${newUser.id}`
  setTimeout(() => {
    router.replace('/')
  }, 1000)
}

const goBack = () => {
  router.replace('/')
}
</script>

<style scoped>
.login-register {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  border-radius: 12px;
}

.login-tabs {
  margin-bottom: 8px;
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
