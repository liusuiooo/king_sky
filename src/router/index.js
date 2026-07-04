import { createRouter, createWebHistory } from 'vue-router'
import Forum from '../components/Forum.vue'
import ForumDetail from '../views/ForumDetail.vue'
import CreatePost from '../views/CreatePost.vue'
import PostDetail from '../views/PostDetail.vue'
import LoginRegister from '../views/LoginRegister.vue'
import MyAccount from '../views/MyAccount.vue'
import Notifications from '../views/Notifications.vue'
import AdminLogin from '../views/AdminLogin.vue'
import AdminDashboard from '../views/AdminDashboard.vue'

const routes = [
  {
    path: '/',
    name: 'Forum',
    component: Forum
  },
  {
    path: '/forum/create',
    name: 'CreatePost',
    component: CreatePost
  },
  {
    path: '/forum/post/:postId',
    name: 'PostDetail',
    component: PostDetail
  },
  {
    path: '/forum/:id',
    name: 'ForumDetail',
    component: ForumDetail
  },
  {
    path: '/login',
    name: 'LoginRegister',
    component: LoginRegister
  },
  {
    path: '/my-account',
    name: 'MyAccount',
    component: MyAccount
  },
  {
    path: '/user/:userId',
    name: 'UserProfile',
    component: MyAccount
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: Notifications
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: AdminLogin
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: AdminDashboard
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router