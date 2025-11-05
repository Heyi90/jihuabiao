This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
## 项目文档

- [贡献者指南（AGENTS.md）](docs/AGENTS.md)
- [项目需求文档（REQUIREMENTS.md）](docs/REQUIREMENTS.md)

## 部署到 Vercel（使用 KV 持久化）

本项目已接入简单的注册/登录与计划保存功能。生产环境推荐使用 Vercel KV 作为持久化存储；本地开发则自动回退到项目目录 `data/` 下的 JSON 文件存储（已在 `.gitignore` 忽略）。

步骤：

1) 在 Vercel 创建 KV 实例
- Vercel 控制台 → Storage → KV → Create Database
- 创建完成后在 Overview 页复制以下三个值：
  - KV_REST_API_URL
  - KV_REST_API_TOKEN
  - KV_REST_API_READ_ONLY_TOKEN

2) 配置项目环境变量
- Vercel 控制台 → Project → Settings → Environment Variables（Production）
- 新增：
  - AUTH_SECRET：随机长字符串（用于签名 Cookie）
  - KV_REST_API_URL：上一步复制
  - KV_REST_API_TOKEN：上一步复制
  - KV_REST_API_READ_ONLY_TOKEN：上一步复制
- 保存后 Redeploy。

3) 触发部署
- 通过 GitHub 推送触发，或在 Vercel Deployments 页面点 Redeploy（使用 main 最新提交）。

4) 本地开发
- 不配置 KV 环境变量即可使用本地 JSON 文件存储（目录 `data/`）。
- 开发命令：`npm run dev`

端点说明（需登录后使用）
- POST /api/auth/register { username, password }
- POST /api/auth/login { username, password, remember }
- POST /api/auth/logout
- GET /api/auth/me
- GET /api/plan / PUT /api/plan
- GET /api/plan/history （?ts=时间戳 可取回具体版本）

注意事项
- 由于 Vercel 无持久磁盘，线上必须使用 KV（或改用 Postgres 等外部持久化）才能长期保存数据。
- 本项目 API 路由已固定为 Node.js 运行时（`export const runtime = 'nodejs'`）。
- 使用 Next.js 16，`cookies()` 为异步 API，已在服务端正确 `await`。
