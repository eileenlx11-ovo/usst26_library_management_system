# 图书馆管理系统

> 数据库原理课程大作业 · 前端负责人B

基于 HTML/CSS/JavaScript + Spring Boot + MyBatis-Plus + MySQL 的图书馆管理系统，采用前后端分离架构，三级角色权限隔离，全模块直连数据库。

## 目录结构

```
├── index.html / books.html / borrow.html / readers.html / report.html / admin.html / login.html
├── styles.css / script.js
├── js/
│   ├── api.js          # API 服务层（31个端点全对接）
│   └── mock-data.js    # Mock 回退数据
├── pom.xml             # Spring Boot 2.7.5 + MyBatis-Plus 3.5.5
├── src/                # 后端源码（12个Controller, 52个Java文件）
│   └── main/java/com/lib/
│       ├── controller/       # Controller（12个）
│       ├── service/          # Service 接口 + 实现
│       ├── mapper/           # MyBatis-Plus Mapper
│       ├── entity/           # 数据库实体（含 User, InviteCode）
│       ├── pojo/             # 借阅模块 POJO
│       ├── dto/              # 图书模块 DTO
│       └── vo/               # 图书模块 VO
├── database/           # SQL 建表 + 测试数据 + 触发器和存储过程 + 查询脚本
├── 后端接口/            # 后端原始代码（已废弃，见 src/）
└── 前端A/              # 参考代码
```

## 角色权限分配

| 页面 | 读者 | 图书管理员 | 系统管理员 |
|------|:--:|:--------:|:--------:|
| 仪表盘 | ✅ 个人统计 | ✅ 全局统计 | ✅ 全局统计 |
| 图书管理 | ✅ 搜索+借阅 | ✅ CRUD | ✅ CRUD |
| 借阅管理 | ✅ 个人记录+续借/归还 | ✅ 全部+借还+催还+罚款 | ✅ 全部+借还+催还+罚款 |
| 读者管理 | ❌ | ✅ CRUD | ✅ CRUD |
| 统计报表 | ❌ | ❌ | ✅ 图表+逾期名单 |
| 系统安全 | ❌ | ❌ | ✅ 权限/分类/规则/邀请码 |

## 后端 API 清单（31 个端点）

### 认证模块
| 端点 | 说明 |
|------|------|
| `POST /auth/login` | 用户登录 |
| `POST /auth/register` | 用户注册（含邀请码校验） |

### 图书模块
| 端点 | 方法 | 说明 |
|------|------|------|
| `/bookadmin/book/page` | GET | 分页查询（支持书名/作者/ISBN/分类/状态） |
| `/bookadmin/book/{id}` | GET | 图书详情 |
| `/bookadmin/book/add` | POST | 添加图书 |
| `/bookadmin/book` | PUT | 修改图书 |
| `/bookadmin/book/{id}` | DELETE | 删除图书 |
| `/reader/book/page` | GET | 读者端查书 |

### 借阅模块
| 端点 | 方法 | 说明 |
|------|------|------|
| `/bookadmin/borrow/lend` | POST | 借书 |
| `/bookadmin/borrow/return` | POST | 还书（自动计算逾期罚款） |
| `/bookadmin/borrow/renew` | POST | 续借 |
| `/bookadmin/borrow/notify` | POST | 逾期催还检查 |
| `/bookadmin/borrow/list` | GET | 全部借阅记录 |
| `/bookadmin/borrow/list/{readerId}` | GET | 读者个人借阅记录 |
| `/bookadmin/borrow/fines` | GET | 罚款列表（含读者信息） |
| `/reader/borrow/list/{readerId}` | GET | 读者端个人记录 |

### 读者模块
| 端点 | 方法 | 说明 |
|------|------|------|
| `/bookadmin/reader/list` | GET | 读者列表（关键词搜索） |
| `/bookadmin/reader` | POST | 添加读者 |
| `/bookadmin/reader` | PUT | 修改读者 |
| `/bookadmin/reader/{id}` | DELETE | 删除读者 |
| `/reader/profile/{id}` | GET/PUT | 读者个人信息 |

### 系统管理模块
| 端点 | 方法 | 说明 |
|------|------|------|
| `/systemadmin/admin/users` | GET/POST/PUT/DELETE | 用户权限管理 |
| `/systemadmin/book/categories` | GET/POST/DELETE | 分类管理 |
| `/systemadmin/borrow/rules` | GET/POST | 规则管理 |
| `/systemadmin/borrow/rule/{type}` | GET | 按类型查规则 |
| `/systemadmin/tool/hot-books` | GET | 热门图书统计 |
| `/systemadmin/tool/active-readers` | GET | 活跃读者统计 |
| `/systemadmin/tool/overdue-list` | GET | 逾期催还名单 |
| `/systemadmin/tool/fine-list` | GET | 罚款明细 |
| `/systemadmin/invite/list` | GET | 邀请码列表 |
| `/systemadmin/invite/generate` | POST | 生成邀请码 |
| `/systemadmin/invite/revoke/{id}` | PUT | 吊销邀请码 |

统一响应格式：
```json
{ "code": 200, "msg": "success", "data": { ... } }
{ "code": 500, "msg": "错误描述", "data": null }
```

## 数据链路

```
浏览器 (http://localhost:5500)
    │
    └── 全部模块 → fetch → localhost:8080 → Spring Boot → MyBatis-Plus → MySQL library_db ✅
```

## 使用方法

1. IDEA 打开项目根目录 → Maven Reload → Run `LibrarySystemApplication`
2. `python -m http.server 5500` → `http://localhost:5500/login.html`
3. 示例账号：

| 用户名 | 密码 | 角色 | 关联读者 |
|--------|------|------|---------|
| admin | admin123 | 系统管理员 | — |
| lib_manager1 | libmgr123 | 图书管理员 | — |
| chensiyuan | csy12345 | 读者 | 陈思远（本科生） |
| zhangminghui | zmh12345 | 读者 | 张明慧（研究生） |
| majianguo | mjg12345 | 读者 | 马建国（教师） |

4. 数据库配置：`src/main/resources/application.properties`（库名 `library_db`，用户 `root`，密码 `123456`）

## 数据库测试数据

| 表 | 条数 |
|------|:--:|
| Author | 15+ |
| Publisher | 8+ |
| Category | 80+ |
| Book | 118 |
| Reader | 120 |
| Rule | 4 |
| BorrowRecord | 151 |
| Fine | 动态（归还时自动生成） |
| User | 105+ |
| InviteCode | 动态 |

## 改版记录

### v3.0 — 全模块直连数据库 + 后端全部补齐（2026-06-15）

- ✅ **后端补齐 22 个缺失接口**：AuthController（登录/注册）、InviteCodeController（邀请码CRUD）、bookadmin/ReaderController（读者CRUD）、bookadmin/BorrowController扩展（记录列表+罚款）、reader/BorrowController（个人记录）、reader/ReaderController（个人信息）、systemadmin/AdminController（用户CRUD）、systemadmin/BookController（分类CRUD）、systemadmin/BorrowController（规则CRUD）、systemadmin/ToolController（4报表）
- ✅ **修复合并冲突**：去掉 PageHelper → 统一 MyBatis-Plus 分页；POJO 手写 getter/setter 兼容 JDK17
- ✅ **修复数据库问题**：Rule 表去重、Fine 表 UNIQUE 约束冲突、中文库名改英文 `library_db`
- ✅ **借阅模块对接**：借/还/续/催 + 记录列表 + 罚款列表 全走 API
- ✅ **读者管理对接**：读者 CRUD 全走 API
- ✅ **统计报表对接**：热门图书/活跃读者/逾期名单/罚款明细 全走 API
- ✅ **系统安全对接**：用户CRUD/分类管理/规则管理/邀请码 全走 API
- ✅ **登录注册对接**：登录 `POST /auth/login`、注册 `POST /auth/register` 走 API
- ✅ **仪表盘对接**：4指标 + 待办列表 全从 API 实时计算
- ✅ 待办列表可滚动，显示全部条目，点击一键跳转
- ✅ `api.js` 全模块 31 端点覆盖

### v2.3 — 数据库 schema 对齐（2026-06-11）
- ✅ mock-data.js 对齐 10 表，读者类型扩展为 4 种

### v2.2 — 注册 + 邀请码（2026-06-11）
- ✅ 登录/注册双表单切换，邀请码生成/校验机制

### v2.1 — 初始整合（2026-06-11）
- ✅ 前端A深绿配色 + 前端B多页面架构 + 三重角色权限隔离
