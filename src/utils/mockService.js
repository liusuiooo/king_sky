/**
 * mockService.js - Mock.js 动态后端接口模拟
 *
 * 使用 Mock.js 的 @模板语法 实时生成随机数据，
 * 每次页面刷新都会生成全新的帖子、点赞、回复数据。
 *
 * 【设计原理】
 * 1. 首次请求某 key 时，用 Mock.mock(@模板) 动态生成数据并缓存到内存
 * 2. 同一次页面加载内，后续请求返回缓存数据，保证数据一致性
 * 3. 页面刷新后重新生成，模拟"真实后端每次返回不同内容"
 * 4. POST 请求写入的数据（如登录状态、新帖子）会持久化到内存
 *
 * 【与真实后端切换】
 * 注释掉 src/main.js 中的 import './utils/mockService.js'
 * 修改 src/utils/api.js 中的 baseURL 为真实后端地址
 * 所有 Vue 组件无需任何修改
 */

import Mock from 'mockjs'

// ========================================
// 1. Mock.js @模板 — 定义数据结构
// ========================================

// 作者列表模板
const authorTemplate = {
  'nickname': '@pick(["清风明月","南山南","星河滚烫","梦里花落","一剑霜寒","长安故里","北冥有鱼","云深不知处","煮酒论英雄","江湖夜雨","春风十里","人间失格","浮生若梦","踏雪无痕","醉里挑灯"])',
  avatar: null
}

// 帖子模板 — 每次调用生成随机帖子数组
const postListTemplate = {
  // '|25-35': 表示生成 25~35 条
  'posts|27-30': [{
    'id|+1': 10000,
    'title': '@ctitle(10, 25)',
    'content': '@cparagraph(2, 6)',
    'sectionName': '@pick(["网文江湖","太极八卦","前沿科技","游戏天堂","业界招聘","体育竞技","历史文化","动漫在线"])',
    'authorNickname': '@pick(["清风明月","南山南","星河滚烫","梦里花落","一剑霜寒","长安故里","北冥有鱼","云深不知处","煮酒论英雄","江湖夜雨","春风十里","人间失格","浮生若梦","踏雪无痕","醉里挑灯"])',
    'authorId|1000-1014': 1000,
    'createdAt': '@datetime("yyyy-MM-dd HH:mm:ss")',
    images: [],
    files: []
  }]
}

// 点赞模板
const likeTemplate = {
  'likes|200-400': [{
    'postId|10000-10800': 10000,
    'userId|1000-1014': 1000
  }]
}

// 回复模板
const replyTemplate = {
  'replies|150-300': [{
    'id|+1': 1,
    'postId|10000-10800': 10000,
    'content': '@pick(["说得好，深有同感！","感谢分享，学到了很多。","这个观点很有意思，值得深思。","顶一个，说的很有道理。","不同意，我觉得事情不是这样的。","有没有更多的资料可以参考？","收藏了，慢慢看。","前排占座，等更新。","说的太对了，我也遇到同样的问题。","补充一点我的看法……","哈哈，太真实了。","mark一下，以后再看。","楼主辛苦了，写的很详细。","之前就关注这个话题了，终于有人讨论了。","这个坑我也踩过，血泪教训啊。"])',
    'authorId|1000-1014': 1000,
    'authorNickname': '@pick(["清风明月","南山南","星河滚烫","梦里花落","一剑霜寒","长安故里","北冥有鱼","云深不知处","煮酒论英雄","江湖夜雨","春风十里","人间失格","浮生若梦","踏雪无痕","醉里挑灯"])',
    parentReplyId: null,
    parentAuthorNickname: null,
    'createdAt': '@datetime("yyyy-MM-dd HH:mm:ss")'
  }]
}

// ========================================
// 2. 内存数据库
// ========================================
const db = {
  // 持久化数据（用户登录、发帖等写入操作）
  forum_current_user: null,
  forum_mock_injected: 2,
  _generated: false  // 标记是否已生成动态数据
}

// 动态数据（每次页面刷新重新生成）
function ensureDataGenerated() {
  if (db._generated) return

  // 用 Mock.mock 执行 @模板，生成随机数据
  const postsResult = Mock.mock(postListTemplate)
  const likesResult = Mock.mock(likeTemplate)
  const repliesResult = Mock.mock(replyTemplate)

  db.forum_posts = postsResult.posts
  db.forum_likes = likesResult.likes
  db.forum_replies = repliesResult.replies
  db._generated = true

  console.log(`[mockService] 动态数据已生成：${db.forum_posts.length} 条帖子, ${db.forum_likes.length} 个点赞, ${db.forum_replies.length} 条回复`)
  console.log('[mockService] 帖子样例:', db.forum_posts[0])
}

// ========================================
// 3. 工具函数
// ========================================
function getQueryParam(url, param) {
  const idx = url.indexOf('?')
  if (idx === -1) return null
  return new URLSearchParams(url.substring(idx + 1)).get(param)
}

// ========================================
// 4. Mock.js 拦截规则
// ========================================

Mock.setup({ timeout: '200-800' })

// ---------- 4.1 GET /api/data?key=xxx ----------
// 对应 getItem(key)
Mock.mock(/\/api\/data(\?.*)?$/, 'get', (options) => {
  const key = getQueryParam(options.url, 'key')
  if (!key) {
    return { code: 400, message: '缺少 key 参数', data: null }
  }

  // 确保动态数据已生成
  ensureDataGenerated()

  // 从内存数据库读取
  const data = db.hasOwnProperty(key) ? db[key] : null

  return {
    code: 200,
    message: 'success',
    data: data ? JSON.parse(JSON.stringify(data)) : null
  }
})

// ---------- 4.2 POST /api/data ----------
// 对应 setItem(key, value)
// 用于：用户登录、发帖、点赞、回复等写入操作
Mock.mock('/api/data', 'post', (options) => {
  try {
    const body = JSON.parse(options.body)
    const { key, value } = body
    if (!key) {
      return { code: 400, message: '缺少 key 参数', data: null }
    }

    // 写入内存数据库
    db[key] = JSON.parse(JSON.stringify(value))
    console.log(`[mockService] 写入数据: ${key}`, value)

    return { code: 200, message: 'success', data: true }
  } catch (e) {
    return { code: 400, message: '请求体格式错误', data: null }
  }
})

// ---------- 4.3 DELETE /api/data/:key ----------
// 对应 removeItem(key)
Mock.mock(/\/api\/data\/(.+)/, 'delete', (options) => {
  const match = options.url.match(/\/api\/data\/(.+)/)
  if (!match) {
    return { code: 400, message: '缺少 key 参数', data: null }
  }
  const key = match[1]
  delete db[key]
  return { code: 200, message: 'success', data: true }
})

// ---------- 4.4 GET /api/keys ----------
// 对应 keys()
Mock.mock('/api/keys', 'get', () => {
  ensureDataGenerated()
  return { code: 200, message: 'success', data: Object.keys(db) }
})

console.log('[mockService] Mock.js 已启动，拦截 /api/* 请求')
