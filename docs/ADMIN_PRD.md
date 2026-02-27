# 运营后台产品需求文档（PRD）

## 🎯 目标

提供一个只对内部管理员开放的 Web 管理界面，以：

- 管理用户与登录行为  
- 维护前端的可配置项（语言包、主题、算法参数等）  
- 查看并分析计算使用情况  
- 发布公告/帮助信息  
- 支持未来扩展（多角色、数据导出等）

---

## 🧱 数据模型

### 1. 管理员账户

- **表**：`admins`  
- 字段：`id`、`username`、`password_hash`、`email`、`role`（super/admin/editor）、`created_at`、`last_login`  
- 登录和 JWT 与 C 端共用，只在 payload 增加 `is_admin`/`role`

### 2. 用户表

- **表**：`users`（C 端保持不变）  
- **表**：`admin_users`（运营专用）  
  - `id`、`username`、`email`、`locale`、`theme_id`、`is_banned`、`created_at`、`last_active`  
  - 运营表用于统计、改名、禁用；与 C 端用户一对一或复制所需字段

### 3. 配置表

| 名称                 | 作用                                 | 典型字段                              |
|----------------------|--------------------------------------|---------------------------------------|
| `site_settings`      | 站点级参数（比如默认语言/主题）      | `key`、`value`                        |
| `language_strings`   | 国际化文案（i18n）                   | `locale`、`key`、`text`               |
| `themes`             | 可选主题列表                         | `id`、`name`、`css_vars`、`order`     |
| `math_rules`         | 计算规则参数（五行、忌数等）         | JSON 字段存放参数                    |
| `announcements`      | 公告、帮助内容                       | `title`、`body`、`locale`、`active`   |

### 4. 统计/记录

- `calculate_logs`：记录每次 API 请求，包含 `user_id`、`pet_name`、`death_date`、`locale`、`result_json`、`created_at`

---

## 🛠 主要功能模块

### A. 登录与权限

- **管理员登录页**：单独路由 `/admin/login`。  
- 登录状态存储 JWT，带 `is_admin`。  
- 所有 `/admin/*` 路由中间件检查该标志，未通过则返回 403。

### B. 用户管理

- 列表/搜索/分页（用户名、邮箱、注册时间、活跃度）
- 查看详情，修改语言、主题、禁用/解禁、删除账号
- 导出 CSV（可选）

### C. 配置管理

- **语言文本**：可按 locale 增删改查。支持 key 自动补全，预览效果。  
- **主题**：新增/编辑主题颜色（在 `themes.json` 之外提供 GUI），排序；切换是否启用供 C 端选择。  
- **算法规则**：编辑五行吉日参数、吉数/忌数等 JSON；提供“恢复默认”按钮。  
- **站点设置**：比如首页文案、JWT 过期时间、热门提示词等。

### D. 运营内容

- 发布/编辑公告、帮助文档，多语言支持
- 可以设置发布状态、开始/结束时间
- 前端显示位置接口 `/api/announcements?locale=zh`

### E. 统计报表

- **基础计数**：注册用户总数、今日活跃、计算次数
- **趋势图**：按天/周展示计算请求数；可按 locale 过滤
- **热门宠物名/日期**（从 `calculate_logs` 聚合）
- 导出报表 CSV

### F. 日志与审计

- 管理员操作日志：谁在何时创建/删除了什么
- 异常请求列表（可与 Sentry/Flask log 集成）

### G. 扩展项

- 多管理员角色（超级管理员、内容编辑、统计查看）
- 系统备份/恢复、清理测试用户工具

---

## 🧩 前端结构建议

- 新增 `/frontend/src/admin` 目录  
  - 使用相同的 React + TypeScript + Antd 组件  
  - 入口 `AdminApp.tsx` 包含独立路由（`/admin/login`, `/admin/dashboard`, `/admin/users`, …）  
  - 提供 `AdminProvider` 管理权限状态、API 客户端扩展  
- 公共组件可共用（`api/client.ts` 添加 admin endpoints，`i18n.ts` 复用）  
- Jotai atom 增加 `adminUserAtom`，保存当前管理员信息

---

## 📦 后端改动概览

1. 增 `admins` 表与登录接口  
2. 修改 `auth_utils` 支持管理员角色、JWT payload  
3. 添加 `/api/admin/*` 路由组，包含：  
   - `GET /users`、`PUT /users/:id`  
   - `GET /calculate_logs`  
   - `GET/POST/PUT /settings/:key` 等  
4. 加配置读取/写入逻辑（可用 SQLite JSON 字段或新的配置表）  
5. 迁移脚本更新数据库结构  

---

## ✅ 优先级建议

1. 基础框架：管理员认证、路由保护、用户列表  
2. 配置管理界面（语言/主题/算法参数）  
3. 记录与统计模块  
4. 内容发布与公告  
5. 高级功能（角色、报表导出、审计）
