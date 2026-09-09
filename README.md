# 智能题库刷题系统

一个本地优先的智能题库工具：将 TXT/Markdown 文档转换为结构化题库，支持人工校对、顺序/随机/错题练习、练习报告和完整数据备份。

> 当前版本面向本地单用户使用。代码可以公开，但在增加认证、资源权限和限流前，请勿将应用直接部署为公网多用户服务。

## 主要能力

- 规则解析单选、多选、判断和填空题，兼容常见中文题号与答案标记。
- 解析结果支持置信度提示、批量选择、修改和删除。
- 支持顺序练习、随机练习、错题重练、断点续练和逐题报告。
- 题库与题目支持编辑、删除；答题提交具有事务和幂等保护。
- 支持版本化 JSON 完整备份、校验和无覆盖合并恢复。
- 提供 Vitest 单元/集成测试、Playwright 关键流程测试和 GitHub Actions CI。

---

## 安装与启动

### 1. 安装 Node.js 24

下载安装：https://nodejs.org 。项目通过 `.nvmrc` 和 `package.json#engines` 固定 Node.js 24。

### 2. 双击 `启动.bat`

首次运行会自动安装依赖和创建数据库。浏览器会自动打开，首次加载可能需要刷新一下。黑窗口**不能关**，Ctrl+C 可停止。

macOS/Linux 或命令行用户：

```bash
npm ci
cp .env.example .env
npm run db:prepare
npm run dev
```

---

## 使用流程

1. **导入题库** — 点击「导入题库」，上传 txt 或 md 文件
2. **预览校对** — 检查识别结果，可修改题型/答案/解析，确认后点「确认导入」
3. **开始刷题** — 进入题库详情，选择练习模式：
   - **顺序练习**：按原文顺序作答
   - **随机练习**：乱序抽取
   - **错题重练**：只做错过的题
4. **查看报告** — 完成后显示正确率，错题自动收入「错题本」
5. **备份数据** — 首页可导出完整 JSON 备份，也可合并恢复；相同数据会跳过，冲突数据不会覆盖

---

## 题目文档格式

写法很自由，以下都可以：

```
1. 中国的首都是？
A. 上海
B. 北京
C. 广州
D. 深圳
答案: B
解析: 北京是中华人民共和国首都。

2. 以下哪些是基本数据类型？（多选）
A. String
B. Number
C. Object
D. Boolean
答案: A, B, D

3. Linux 中查看当前目录的命令是____。
答案: pwd
```

支持 `1.` `1、` `（1）` `一、` `第1题` 等编号，`A.` `A）` `（A）` 等选项格式，`答案:` `参考答案:` `正确答案:` `【答案】` 等答案标记。中英文标点、全角半角冒号均可。也支持 markdown 文件。

---

## 常见问题

**Q：浏览器显示「无法访问 / refused to connect」？**  
A：`启动.bat` 没在运行。每次使用前都要先双击启动。

**Q：需要安装数据库吗？**  
A：不需要。SQLite 单文件数据库，`启动.bat` 首次运行会自动创建。

**Q：题库数据存在哪？**  
A：`prisma/dev.db` 这一个文件。备份直接复制它就行。

首页的「导出备份」还可以生成跨版本更易校验的 JSON 文件。恢复时会在事务中校验全部关联关系，不会覆盖 ID 相同但内容不同的数据。

---

## 开发与验证

```bash
npm run db:prepare  # 首次创建或无损迁移数据库
npm run dev         # 开发服务器
npm run check       # ESLint + TypeScript + 单元/集成测试 + 生产构建
npm run test:e2e    # 使用独立临时数据库运行关键浏览器流程
```

业务代码按题库、题目、导入、练习和备份划分在 `src/features/`；页面与 API 路由只负责交互和 HTTP，所有 Prisma 访问集中在 `src/server/`。

## 技术栈与结构

- Next.js 16、React 19、TypeScript、Tailwind CSS
- Prisma ORM、SQLite、Zod
- Vitest、Testing Library、Playwright

```text
src/app/       页面与 Route Handlers
src/features/  领域契约、服务、客户端与功能组件
src/server/    server-only Prisma 数据访问层
prisma/        Schema 与可追踪的数据库迁移
tests/         集成、组件与端到端测试
```

## 贡献与安全

- 贡献流程见 [CONTRIBUTING.md](CONTRIBUTING.md)。
- 安全边界与漏洞报告方式见 [SECURITY.md](SECURITY.md)。
- `.env`、`prisma/dev.db`、导出的备份及真实题库内容不得提交。

## 许可证

本项目采用 [MIT License](LICENSE)。
