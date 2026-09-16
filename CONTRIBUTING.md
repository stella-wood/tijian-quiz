# 参与贡献

感谢你愿意改进题笺（Tijian Quiz）。提交改动前，请先阅读以下约定。

## 本地开发

1. 安装 Node.js 24。
2. 运行 `npm ci` 安装锁定版本的依赖。
3. 将 `.env.example` 复制为 `.env`。
4. 运行 `npm run db:prepare` 创建或迁移本地数据库。
5. 运行 `npm run dev` 启动应用。

`prisma/dev.db` 包含个人题库和练习记录，请勿提交。

## 提交改动

- 从 `main` 创建独立分支，每个 Pull Request 聚焦一个问题。
- 保持 API 向后兼容；需要改变数据结构时必须提供 Prisma migration。
- 数据访问应保留在 `src/server/`，页面和 Route Handler 不直接导入 Prisma。
- 新业务能力按 `src/features/` 中的现有模块边界组织，并为公开输入提供 Zod 校验。
- 修复缺陷时应增加回归测试，避免提交无关格式化改动。

提交前运行：

```bash
npm run check
npm run test:e2e
```

Pull Request 应说明改动目标、验证方式、是否涉及数据库迁移，以及可见界面变化的截图。
