# Cloudflare Workers 数据库选项完整指南

> **核心问题**: Cloudflare Workers 可以连接哪些数据库？

---

## 一、Cloudflare 自家的数据库产品

### 1.1 Cloudflare D1（推荐）⭐⭐⭐⭐⭐

**什么是D1？**
- Cloudflare自己的分布式SQLite数据库
- 也运行在全球边缘节点
- 与Workers在同一位置（超快！）

```
┌─────────────────────────────────────┐
│   Cloudflare 边缘节点（北京）       │
│                                     │
│   ┌──────────────────────────────┐ │
│   │ 你的Worker代码               │ │
│   └──────────────┬───────────────┘ │
│                  │ 直连（超快！）    │
│   ┌──────────────▼───────────────┐ │
│   │ D1 数据库                    │ │
│   │ (SQLite)                     │ │
│   └──────────────────────────────┘ │
└─────────────────────────────────────┘

延迟: < 1ms ⚡
```

**特点：**
```
语言: SQL (SQLite方言)
类型: 关系型数据库
位置: 全球边缘节点（与Workers同位置）
复制: 自动全球复制

优点:
✅ 超快（与Worker在同一机房）
✅ 标准SQL语法
✅ 免费额度很大
✅ 自动备份
✅ 自动扩展

缺点:
⚠️ 相对较新（2023年推出）
⚠️ 功能比PostgreSQL少
⚠️ 单个数据库最大10GB
```

**免费额度：**
```
每天:
- 5百万次读取
- 10万次写入
- 5GB存储

够用程度: 对我们的项目完全够用！✅
```

**代码示例：**

```javascript
// Cloudflare Worker 使用 D1
export default {
  async fetch(request, env) {
    // 查询用户
    const result = await env.DB.prepare(
      'SELECT * FROM users WHERE wechat_openid = ?'
    ).bind(openid).first();

    // 插入数据
    await env.DB.prepare(
      'INSERT INTO passports (user_id, passport_no, name) VALUES (?, ?, ?)'
    ).bind(userId, passportNo, name).run();

    // 更新数据
    await env.DB.prepare(
      'UPDATE users SET nickname = ? WHERE id = ?'
    ).bind(nickname, userId).run();

    return new Response(JSON.stringify(result));
  }
};
```

**创建表：**

```sql
-- D1 使用标准SQLite语法
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wechat_openid TEXT UNIQUE NOT NULL,
  nickname TEXT,
  avatar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE passports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  passport_no TEXT NOT NULL,
  name TEXT,
  expiry DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_passports_user ON passports(user_id);
```

**部署D1：**

```bash
# 1. 创建D1数据库
wrangler d1 create trip-secretary-db

# 输出：
# database_name = "trip-secretary-db"
# database_id = "xxx-xxx-xxx"

# 2. 配置wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "trip-secretary-db"
database_id = "xxx-xxx-xxx"

# 3. 运行迁移
wrangler d1 execute trip-secretary-db --file=./schema.sql

# 4. 部署Worker
wrangler deploy
```

---

### 1.2 Cloudflare KV（键值存储）⭐⭐⭐⭐

**什么是KV？**
- 简单的键值对存储
- 也在全球边缘节点
- 适合缓存和配置

```javascript
// Cloudflare KV 示例
export default {
  async fetch(request, env) {
    // 写入数据
    await env.MY_KV.put('user:123', JSON.stringify({
      name: '张伟',
      passport: 'E12345678'
    }));

    // 读取数据
    const userData = await env.MY_KV.get('user:123', 'json');

    // 删除数据
    await env.MY_KV.delete('user:123');

    // 列出所有键
    const keys = await env.MY_KV.list({ prefix: 'user:' });

    return new Response(JSON.stringify(userData));
  }
};
```

**特点：**
```
类型: 键值对存储（NoSQL）
位置: 全球边缘节点
延迟: < 5ms（读）, < 1s（写入全球复制）

适合存储:
✅ 缓存数据
✅ 配置文件
✅ 会话数据
✅ 翻译缓存
✅ 政策库

不适合:
❌ 复杂查询
❌ 关系数据
❌ 事务
```

**免费额度：**
```
每天:
- 10万次读取
- 1000次写入
- 1GB存储

成本: 免费额度对我们够用 ✅
```

**实际使用场景：**

```javascript
// 缓存翻译结果
export default {
  async fetch(request, env) {
    const { text, from, to } = await request.json();

    // 1. 先查缓存
    const cacheKey = `translation:${from}:${to}:${text}`;
    const cached = await env.TRANSLATIONS.get(cacheKey);
    
    if (cached) {
      return new Response(cached); // 命中缓存，超快！
    }

    // 2. 缓存未命中，调用翻译API
    const translation = await callBaiduTranslate(text, from, to);

    // 3. 存入缓存（1小时过期）
    await env.TRANSLATIONS.put(
      cacheKey, 
      translation,
      { expirationTtl: 3600 }
    );

    return new Response(translation);
  }
};
```

---

### 1.3 Cloudflare R2（对象存储）⭐⭐⭐⭐

**什么是R2？**
- 类似AWS S3的对象存储
- 存储文件（图片、PDF等）
- 零出站费用

```javascript
// Cloudflare R2 示例
export default {
  async fetch(request, env) {
    // 上传文件
    await env.MY_BUCKET.put('passport-photos/user123.jpg', fileData, {
      httpMetadata: {
        contentType: 'image/jpeg'
      }
    });

    // 下载文件
    const file = await env.MY_BUCKET.get('passport-photos/user123.jpg');
    const blob = await file.arrayBuffer();

    // 删除文件
    await env.MY_BUCKET.delete('passport-photos/user123.jpg');

    // 列出文件
    const list = await env.MY_BUCKET.list({ prefix: 'passport-photos/' });

    return new Response(blob, {
      headers: { 'Content-Type': 'image/jpeg' }
    });
  }
};
```

**特点：**
```
类型: 对象存储（文件存储）
位置: Cloudflare全球网络

适合存储:
✅ 护照照片
✅ 签证照片
✅ 生成的PDF
✅ 用户头像
✅ 任何文件

优点:
✅ 零出站费用（下载不收费！）
✅ 比AWS S3便宜10倍
✅ 全球CDN加速
```

**免费额度：**
```
每月:
- 10GB存储
- 100万次读取
- 100万次写入

成本: 对我们完全够用 ✅
```

---

### 1.4 Cloudflare Durable Objects（高级）⭐⭐⭐

**什么是Durable Objects？**
- 有状态的Worker
- 每个对象有自己的存储
- 适合实时协作、聊天等

```javascript
// Durable Object 示例
export class Counter {
  constructor(state, env) {
    this.state = state;
  }

  async fetch(request) {
    let count = (await this.state.storage.get('count')) || 0;
    count++;
    await this.state.storage.put('count', count);
    return new Response(count);
  }
}
```

**特点：**
```
类型: 有状态对象
用途: 实时协作、游戏、聊天

我们的项目需要吗？
❌ 不需要（太复杂，用不上）
```

---

## 二、可以连接的外部数据库

### 2.1 Supabase（PostgreSQL）⭐⭐⭐⭐⭐

**我们之前讨论的方案**

```javascript
// Worker连接Supabase
import { createClient } from '@supabase/supabase-js';

export default {
  async fetch(request, env) {
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_KEY
    );

    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('wechat_openid', openid);

    return new Response(JSON.stringify(data));
  }
};
```

**特点：**
```
类型: PostgreSQL（关系型数据库）
位置: 新加坡/美国（固定数据中心）
延迟: 200-400ms（从中国）

优点:
✅ 功能强大（PostgreSQL）
✅ 实时订阅
✅ 用户认证
✅ 文件存储
✅ 完整的后端服务

缺点:
⚠️ 延迟比D1高
⚠️ 需要额外服务
```

---

### 2.2 PlanetScale（MySQL）⭐⭐⭐⭐

**什么是PlanetScale？**
- Serverless MySQL数据库
- 由Vitess提供支持（YouTube同款）
- 全球分布

```javascript
// Worker连接PlanetScale
import { connect } from '@planetscale/database';

export default {
  async fetch(request, env) {
    const db = connect({
      host: env.DATABASE_HOST,
      username: env.DATABASE_USERNAME,
      password: env.DATABASE_PASSWORD
    });

    const results = await db.execute(
      'SELECT * FROM users WHERE wechat_openid = ?',
      [openid]
    );

    return new Response(JSON.stringify(results.rows));
  }
};
```

**特点：**
```
类型: MySQL（关系型数据库）
位置: 全球多区域
延迟: 100-300ms

优点:
✅ MySQL兼容
✅ 自动扩展
✅ 分支功能（像Git）
✅ 免费额度

免费额度:
- 1个数据库
- 5GB存储
- 10亿次读取/月
- 1000万次写入/月
```

---

### 2.3 Neon（PostgreSQL）⭐⭐⭐⭐

**什么是Neon？**
- Serverless PostgreSQL
- 自动扩展到零
- 很便宜

```javascript
// Worker连接Neon
export default {
  async fetch(request, env) {
    const response = await fetch(env.DATABASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'SELECT * FROM users WHERE wechat_openid = $1',
        params: [openid]
      })
    });

    const data = await response.json();
    return new Response(JSON.stringify(data));
  }
};
```

**特点：**
```
类型: PostgreSQL
位置: 美国/欧洲
延迟: 200-400ms

优点:
✅ 完整的PostgreSQL
✅ 自动扩展到零（省钱）
✅ 免费额度

免费额度:
- 512MB数据库
- 3GB存储
```

---

### 2.4 MongoDB Atlas（NoSQL）⭐⭐⭐

**什么是MongoDB Atlas？**
- 托管的MongoDB服务
- 文档型数据库

```javascript
// Worker连接MongoDB
export default {
  async fetch(request, env) {
    const response = await fetch(env.MONGODB_DATA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': env.MONGODB_API_KEY
      },
      body: JSON.stringify({
        dataSource: 'Cluster0',
        database: 'borderbuddy',
        collection: 'users',
        filter: { wechat_openid: openid }
      })
    });

    return response;
  }
};
```

**特点：**
```
类型: NoSQL（文档数据库）
位置: 全球多区域

适合:
✅ 灵活的数据结构
✅ 文档存储
⚠️ 学习曲线（如果不熟悉MongoDB）

免费额度:
- 512MB存储
- 共享实例
```

---

### 2.5 Upstash Redis⭐⭐⭐⭐

**什么是Upstash？**
- Serverless Redis
- 专为边缘优化

```javascript
// Worker连接Upstash Redis
import { Redis } from '@upstash/redis/cloudflare';

export default {
  async fetch(request, env) {
    const redis = new Redis({
      url: env.UPSTASH_REDIS_URL,
      token: env.UPSTASH_REDIS_TOKEN
    });

    // 设置值
    await redis.set('user:123', JSON.stringify({ name: '张伟' }));

    // 获取值
    const user = await redis.get('user:123');

    // 设置过期时间（1小时）
    await redis.setex('session:abc', 3600, sessionData);

    return new Response(user);
  }
};
```

**特点：**
```
类型: Redis（缓存/键值存储）
位置: 全球边缘

适合:
✅ 缓存
✅ 会话存储
✅ 实时计数器
✅ 排行榜

免费额度:
- 10,000 命令/天
```

---

## 三、推荐方案对比

### 3.1 我们项目的需求

```
需要存储:
1. 用户信息（账号、昵称、头像）
2. 证件信息（护照、签证）
3. 生成历史
4. 文件（护照照片、PDF）
5. 缓存（翻译、政策库）
```

### 3.2 方案对比

| 方案 | 优点 | 缺点 | 成本 | 推荐度 |
|------|------|------|------|--------|
| **Cloudflare D1** | 超快、免费、简单 | 功能较少 | 免费 | ⭐⭐⭐⭐⭐ |
| **Supabase** | 功能全面、认证 | 延迟高 | 免费→$25 | ⭐⭐⭐⭐⭐ |
| **D1 + R2 + KV** | 全Cloudflare、最快 | 需要组合 | 免费 | ⭐⭐⭐⭐⭐ |
| **PlanetScale** | MySQL、免费额度大 | 不如PostgreSQL | 免费→$29 | ⭐⭐⭐⭐ |
| **MongoDB** | 灵活 | 学习成本 | 免费→$57 | ⭐⭐⭐ |

---

## 四、最佳方案推荐

### 方案A：纯Cloudflare栈（推荐）⭐⭐⭐⭐⭐

```
┌───────────────────────────────────────┐
│   React Native APP                    │
│   - 本地SQLite（离线数据）            │
└──────────────┬────────────────────────┘
               │
               ↓
┌───────────────────────────────────────┐
│   Cloudflare Workers                  │
└──────────────┬────────────────────────┘
               │
        ┌──────┴──────┐
        ↓             ↓
┌──────────────┐  ┌──────────────────┐
│ Cloudflare   │  │ Cloudflare KV    │
│ D1           │  │ (缓存)           │
│ (主数据库)   │  │ - 翻译缓存       │
│ - 用户       │  │ - 政策库         │
│ - 证件       │  └──────────────────┘
│ - 历史       │
└──────────────┘  ┌──────────────────┐
                  │ Cloudflare R2    │
                  │ (文件存储)       │
                  │ - 护照照片       │
                  │ - 生成的PDF      │
                  └──────────────────┘
```

**优点：**
```
✅ 全部在Cloudflare生态
✅ 延迟最低（都在边缘）
✅ 成本最低（全部免费额度）
✅ 管理最简单（一个平台）
✅ 性能最好
```

**成本：**
```
D1: 免费（5M读/天）
KV: 免费（10万读/天）
R2: 免费（10GB存储）
Workers: 免费（10万次/天）

总成本: ¥0/月 ✅
```

---

### 方案B：混合方案（也不错）⭐⭐⭐⭐

```
┌───────────────────────────────────────┐
│   React Native APP                    │
│   - 本地SQLite（离线数据）            │
└──────────────┬────────────────────────┘
               │
               ↓
┌───────────────────────────────────────┐
│   Cloudflare Workers                  │
└──────────────┬────────────────────────┘
               │
        ┌──────┴──────┐
        ↓             ↓
┌──────────────┐  ┌──────────────────┐
│ Supabase     │  │ Cloudflare KV    │
│ (PostgreSQL) │  │ (缓存)           │
│ - 用户       │  └──────────────────┘
│ - 证件       │
│ - 历史       │
│ - 文件存储   │
└──────────────┘
```

**优点：**
```
✅ PostgreSQL功能强大
✅ Supabase提供认证
✅ 有实时订阅功能
✅ 管理界面好用
```

**缺点：**
```
⚠️ 延迟比纯Cloudflare高
⚠️ 需要管理两个平台
```

**成本：**
```
Supabase: 免费 → $25/月
Cloudflare: 免费

总成本: ¥0-180/月
```

---

## 五、实际代码对比

### 5.1 使用Cloudflare D1

```javascript
// wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "trip-secretary"
database_id = "xxx"

// worker.js
export default {
  async fetch(request, env) {
    // 查询用户
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE wechat_openid = ?'
    ).bind(openid).first();

    // 插入证件
    await env.DB.prepare(
      'INSERT INTO passports (user_id, passport_no) VALUES (?, ?)'
    ).bind(user.id, passportNo).run();

    // 查询历史
    const history = await env.DB.prepare(
      'SELECT * FROM generation_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 10'
    ).bind(user.id).all();

    return new Response(JSON.stringify(history.results));
  }
};
```

### 5.2 使用Supabase

```javascript
// worker.js
import { createClient } from '@supabase/supabase-js';

export default {
  async fetch(request, env) {
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_KEY
    );

    // 查询用户
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('wechat_openid', openid)
      .single();

    // 插入证件
    await supabase
      .from('passports')
      .insert({
        user_id: user.id,
        passport_no: passportNo
      });

    // 查询历史
    const { data: history } = await supabase
      .from('generation_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    return new Response(JSON.stringify(history));
  }
};
```

**代码对比：**
- D1: 更接近原生SQL
- Supabase: 更面向对象，更易读

---

## 六、我的推荐

### 对于我们的项目，我推荐：

**🏆 方案：Cloudflare D1 + KV + R2**

**理由：**

1. **性能最好**
   - 全部在边缘节点
   - 延迟 < 10ms
   - 比Supabase快20-40倍

2. **成本最低**
   - 完全免费（我们的规模）
   - 扩展后也便宜

3. **最简单**
   - 一个平台管理
   - 与Workers天然集成
   - 配置最简单

4. **足够用**
   - D1支持标准SQL
   - 我们不需要PostgreSQL的高级功能
   - 10GB够用（预计用<1GB）

### 数据分配：

```
Cloudflare D1:
├── 用户账号
├── 证件信息
├── 生成历史
└── 应用设置

Cloudflare KV:
├── 翻译缓存
├── 政策库
└── 会话数据

Cloudflare R2:
├── 护照照片
├── 签证照片
└── 生成的PDF

本地SQLite (APP):
├── 离线证件
├── 离线政策
└── 离线模板
```

---

## 七、快速开始

### 使用Cloudflare D1

```bash
# 1. 创建D1数据库
wrangler d1 create trip-secretary

# 2. 创建表结构 (schema.sql)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wechat_openid TEXT UNIQUE NOT NULL,
  nickname TEXT,
  avatar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE passports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  passport_no TEXT,
  name TEXT,
  expiry DATE
);

# 3. 运行迁移
wrangler d1 execute trip-secretary --file=./schema.sql

# 4. 配置wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "trip-secretary"
database_id = "your-database-id"

# 5. 部署
wrangler deploy

# 完成！
```

---

## 八、总结

### Cloudflare支持的数据库：

**Cloudflare自家产品：**
1. ✅ **D1** - SQLite数据库（推荐）
2. ✅ **KV** - 键值存储
3. ✅ **R2** - 对象存储
4. ⚠️ **Durable Objects** - 高级用例

**可连接的外部数据库：**
5. ✅ **Supabase** - PostgreSQL（也很好）
6. ✅ **PlanetScale** - MySQL
7. ✅ **Neon** - PostgreSQL
8. ⚠️ **MongoDB** - NoSQL
9. ✅ **Upstash** - Redis

### 我的推荐：

```
🥇 最佳方案: Cloudflare D1 + KV + R2
   - 性能最好
   - 成本最低
   - 最简单

🥈 备选方案: Supabase
   - 功能更强
   - 管理界面好
   - 稍慢但够用
```

**准备好开始了吗？** 🚀

---

**文档版本：** v1.0  
**最后更新：** 2025-06-01  
**结论：Cloudflare D1是我们的最佳选择**

---

END OF DOCUMENT
