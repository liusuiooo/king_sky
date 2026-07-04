/**
 * storage.js - 基于 localforage (IndexedDB) 的存储工具模块
 *
 * 相比 localStorage，IndexedDB 的优势：
 *   - 存储容量大得多（通常几百 MB ~ 无上限，取决于磁盘空间）
 *   - 无需 JSON.stringify / JSON.parse，原生支持对象/数组/Blob
 *   - 异步 API，不阻塞主线程
 *
 * 自动迁移：首次读取时，若 IndexedDB 中无数据，会从 localStorage 读取并迁移。
 */

import localforage from 'localforage'

// 初始化 localforage 实例，配置数据库名称
const store = localforage.createInstance({
  name: 'king_sky_forum',
  storeName: 'forum_data',
  description: '论坛应用数据存储'
})

/**
 * 从存储中获取数据
 * 如果 IndexedDB 中不存在，则尝试从 localStorage 读取（自动迁移）
 *
 * @param {string} key 存储键名
 * @returns {Promise<any>} 存储的值，不存在时返回 null
 */
export async function getItem(key) {
  try {
    // 优先从 IndexedDB 读取
    let value = await store.getItem(key)
    if (value !== null && value !== undefined) {
      return value
    }

    // 未找到，尝试从 localStorage 迁移
    const lsValue = localStorage.getItem(key)
    if (lsValue !== null) {
      try {
        value = JSON.parse(lsValue)
      } catch {
        value = lsValue
      }
      // 写入 IndexedDB
      await store.setItem(key, value)
      // 迁移完成后删除 localStorage 中的旧数据
      localStorage.removeItem(key)
      return value
    }

    return null
  } catch (e) {
    console.error(`storage.getItem 失败 (key=${key}):`, e)
    // 降级到 localStorage
    const lsValue = localStorage.getItem(key)
    if (lsValue !== null) {
      try {
        return JSON.parse(lsValue)
      } catch {
        return lsValue
      }
    }
    return null
  }
}

/**
 * 将数据写入存储（写入 IndexedDB，同时同步到 localStorage 作为备份）
 *
 * @param {string} key 存储键名
 * @param {any} value 要存储的值
 */
export async function setItem(key, value) {
  try {
    await store.setItem(key, value)
  } catch (e) {
    console.error(`storage.setItem 失败 (key=${key}):`, e)
    // 降级到 localStorage
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (lsError) {
      console.error('localStorage 降级也失败:', lsError)
      throw new Error('存储空间不足')
    }
  }
}

/**
 * 从存储中删除数据
 *
 * @param {string} key 存储键名
 */
export async function removeItem(key) {
  try {
    await store.removeItem(key)
  } catch (e) {
    console.error(`storage.removeItem 失败 (key=${key}):`, e)
  }
  // 同时清理 localStorage 中的旧数据
  localStorage.removeItem(key)
}

/**
 * 获取所有存储的键名列表
 *
 * @returns {Promise<string[]>}
 */
export async function keys() {
  try {
    return await store.keys()
  } catch (e) {
    console.error('storage.keys 失败:', e)
    return []
  }
}

export default { getItem, setItem, removeItem, keys }
