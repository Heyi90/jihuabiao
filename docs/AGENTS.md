# Repository Guidelines

## 项目结构与模块组织
- app/: Next.js App Router 路由与页面（如 app/page.tsx、app/(routes)/...）。
- public/: 静态资源（图标、OG 图等）。
- docs/: 项目文档（AGENTS.md、REQUIREMENTS.md）。
- 配置：next.config.ts、tsconfig.json、eslint.config.mjs、postcss.config.mjs。
- 建议：在 app/ 下按功能划分 components/、lib/、styles/ 子目录，避免跨层依赖。

## 构建、测试与本地运行
- 安装依赖：npm ci（锁版本、可复现）。
- 开发调试：npm run dev（默认 http://localhost:3000）。
- 构建产物：npm run build；生产启动：npm start。
- 代码检查：npm run lint（ESLint 规则见 eslint.config.mjs）。

## 代码风格与命名约定
- TypeScript，2 空格缩进，建议行宽 ≤100；严格类型优先（避免 any）。
- 命名：组件/类型 PascalCase；变量/函数 camelCase；路由段 kebab-case；动态段 [id]。
- React/Next：使用 Server/Client 组件分层；避免不必要的客户端组件。
- Tailwind CSS v4：优先原子类与语义化组合，避免内联 style；抽共用样式为组件或样式片段。

## 测试指引（可选）
- 本仓库暂未集成测试。若引入：
  - 单元/组件：Jest + Testing Library；文件命名 *.test.ts(x)，与被测文件同级或 __tests__/。
  - 端到端：Playwright；核心流程覆盖率优先。

## 提交与 Pull Request
- 建议 Conventional Commits：
  - feat(ui): 增加周视图切换
  - fix(task): 修复拖拽导致的越界
  - docs: 更新使用说明
- PR 要求：清晰描述、关联 Issue、UI 变更附截图/录屏、通过 lint/构建，变更聚焦且可审。
