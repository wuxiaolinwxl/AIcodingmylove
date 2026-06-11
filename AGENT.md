# Memory Space — 项目上下文

> AI 助手须在每次完成有意义的改动后更新本文件（见末尾「维护约定」）。

## 项目简介

情侣应用「双人记忆空间」，pnpm monorepo。
- 后端: NestJS 10 + TypeORM + MySQL 8 + Socket.IO + Web Push
- 前端: Vue 3 + Vite + Pinia + Tailwind + Socket.IO Client + PWA
- 部署: 单服务器 PM2 + Nginx + HTTPS（pm2 应用名 `memory-backend`，日志在 `/var/log/memory-space/`）

## 关键约束

- 无 Redis（单服务器），缓存仅用内存方案
- 保持 API 前后端兼容
- DB_SYNCHRONIZE=true 时 TypeORM 自动同步 schema（开发环境）
- mysql2 默认 `multipleStatements=false`，禁止把多条 SQL 拼在同一次 `query()`
- 改动后端后须 `pnpm --filter backend build && pm2 restart memory-backend`

## 当前进行中的工作

### 性能优化（2026-06-01 启动）

完整审计：`logs/2026-06-01-performance-audit.md`。

**Phase 1（高优先级、低风险）进度：**

- [x] 添加缺失数据库索引（invitation, couple, anniversary, message entities）
- [x] 修复 LoveScoreService 双查询（commit `ef0c875`，2026-06-11；同时修掉了「保存成功却返回 500」的 bug）
- [x] 修复 anniversary.service.ts 两处 N+1（sendReminders + backfillAllCouples）
- [x] 并行化 bucket.service.ts toggleComplete()
- [x] 移除 FilesController 冗余 DB 查询
- [x] 前端 Lucide 图标 tree-shaking（移除 manualChunks icons 项）
- [x] 延迟加载 socket.io-client（Layout 动态 import + chat store 动态 import io）

Phase 1 已落地于 commit `20c1e54`（perf: Phase 1 性能优化）。下一阶段（Phase 2）尚未规划。

## 近期已完成（按时间倒序）

- 2026-06-11 `ef0c875` fix(love-score): 拆分多语句 SQL，修复时光轴/聊天/游戏加分接口 500
- 2026-06-10 `8631b88` fix(push): 移除不可靠的 iOS 版本检测，改为特性检测 + standalone 引导
- 2026-06-?? `fd5ed6e` feat(anniversary): 倒计时卡片与目标时刻设置
- 2026-06-?? `24f6e94` perf: 页面切换 keep-alive 缓存 + 生命周期适配
- 2026-06-01 `20c1e54` perf: Phase 1 性能优化集合落地
- 2026-05-?? `242a869` feat(bucket): 我已选/TA 已选筛选 + 双方状态可见性

## 已知遗留 / 观察项

- 旧 error.log 中残留 `Unknown column 'm.duration'`、`anniversaryDate ''` 等记录均为 5 月旧错误，已被后续提交修复，当前进程未复现
- `logs/` 目录未纳入 git；`AGENT.md` 是否纳入 git 由维护者决定，本文件默认随项目一起提交

## 维护约定

每完成一项有意义的改动（修 bug / 加功能 / 重构 / 性能优化），AI 助手必须：

1. 在「近期已完成」顶部追加一行：`YYYY-MM-DD <commit短哈希> <type>: <一句话>`
2. 若该改动属于「当前进行中的工作」清单，把对应条目勾掉 `[x]` 并补上 commit 哈希
3. 出现新的长期约束/坑（例如 mysql2 多语句限制），写进「关键约束」
4. 发现暂不修但需记住的问题，写进「已知遗留 / 观察项」
5. 整个清单完成后，把章节整体移入历史记录或归档，再开新的 Phase
6. 更新内容随当次代码改动一起提交，commit message 不必单独提及本文件
