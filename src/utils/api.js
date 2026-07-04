/**
 * api.js - 基于 Axios 的API数据访问层
 *
 * 完全兼容 storage.js 的 getItem / setItem / removeItem / keys 接口。
 * 通过 Axios 发起 HTTP 请求，被 Mock.js 拦截后返回模拟数据。
 *
 * 【切换方式】
 * 修改 src/main.js 中的导入路径即可：
 *   import { getItem, setItem } from './utils/storage.js'  →  IndexedDB
 *   import { getItem, setItem } from './utils/api.js'       →  Mock API
 *
 * 【迁移到真实后端】
 * 1. 注释掉 src/main.js 中 import './utils/mockService.js'
 * 2. 修改 baseURL 为真实后端地址
 * 3. 后端实现对应 RESTful 接口
 */

import axios from 'axios'

// 创建 Axios 实例
const http = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 响应拦截器：解包 { code, message, data } 结构
http.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code === 200) {
      return res.data
    }
    console.error(`[api] 请求失败: ${res.message}`)
    return Promise.reject(new Error(res.message || '请求失败'))
  },
  (error) => {
    console.error('[api] 网络错误:', error.message)
    return Promise.reject(error)
  }
)

/**
 * 从 API 获取数据
 * GET /api/data?key=xxx
 *
 * @param {string} key 存储键名
 * @returns {Promise<any>} 存储的值，不存在时返回 null
 */
export async function getItem(key) {
  try {
    return await http.get('/data', { params: { key } })
  } catch (e) {
    console.error(`api.getItem 失败 (key=${key}):`, e)
    return null
  }
}

/**
 * 将数据写入 API
 * POST /api/data  body: { key, value }
 *
 * @param {string} key 存储键名
 * @param {any} value 要存储的值
 */
export async function setItem(key, value) {
  try {
    await http.post('/data', { key, value })
  } catch (e) {
    console.error(`api.setItem 失败 (key=${key}):`, e)
    throw e
  }
}

/**
 * 从 API 删除数据
 * DELETE /api/data/:key
 *
 * @param {string} key 存储键名
 */
export async function removeItem(key) {
  try {
    await http.delete(`/data/${key}`)
  } catch (e) {
    console.error(`api.removeItem 失败 (key=${key}):`, e)
  }
}

/**
 * 获取所有存储的键名列表
 * GET /api/keys
 *
 * @returns {Promise<string[]>}
 */
export async function keys() {
  try {
    return await http.get('/keys')
  } catch (e) {
    console.error('api.keys 失败:', e)
    return []
  }
}

export default { getItem, setItem, removeItem, keys }
