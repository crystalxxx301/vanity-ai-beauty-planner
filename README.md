# VANITY／梳妆台

> A mobile-first AI beauty planner that connects your day, outfit, weather, and beauty bag into one practical makeup plan.

<p align="center"><img src="apps/web/src/assets/figma/landing-hero.png" width="260" alt="VANITY 梳妆台封面插画" /></p>

VANITY 是一款移动端优先的 AI 美妆决策 Web App。它把场景、时间、天气、用户目标和已有产品整理成一套可执行的五阶段妆容方案，并允许用户对单个步骤继续调整。

产品逻辑以 PRD v1.0 + Development Spec 为基线，视觉以 Figma `06 Mobile Flow`（430 × 932）为基线，默认输出中文。

For English readers: this is a working, local-first MVP—not a public AI service. It combines a user's occasion, outfit, weather, and existing products into a five-stage makeup plan. Clone it to run locally with your own OpenAI API key, or explore the clearly labeled Demo Mode. The app's plan output is currently in Chinese. Feedback and ideas are welcome in Issues; please do not post personal photos or API keys there.

## 当前 MVP

- 场景文字输入与一次高价值追问
- 基于结构化输出的五阶段 Beauty Plan
- 对指定步骤进行局部调整
- 用户主动授权后的天气查询；坐标在发送前降低到约 10 公里精度
- 最长 45 秒语音输入，原始音频不在应用内长期保存
- 受限图片理解，仅返回 PRD 允许的外观状态字段
- 商品文字搜索，经 Web Search + LLM Normalize 返回最多 3 个候选
- 本机保存 Beauty Bag 与最近 5 次 Plan History
- 未配置 AI 时可进入明确标注的 Demo Mode；真实输入不会伪装成 AI 结果

这是可在本机实际使用的 MVP，不是已面向多人开放的线上服务。当前没有账户系统或公开站点的访问、用量控制。

> Add Product 的“包装拍照识别”在 MVP 中只保留视觉入口，实际可用链路为文字搜索。

## 技术结构

- Web：React + TypeScript + Vite + Tailwind CSS + Zustand + React Router
- API：TypeScript BFF；本机使用 Node HTTP Server，线上使用 Vercel Function
- AI：OpenAI Responses API、Structured Outputs、Speech-to-Text、Web Search、Vision
- Weather：Open-Meteo
- Storage：浏览器 localStorage

第三方密钥只存在于服务端环境变量中，不会发送到浏览器，也不应提交到 Git。

## 分享与 API Key

公开 GitHub 仓库只包含空白的 `apps/api/.env.example`，不包含你的 `apps/api/.env`。本项目的 `.gitignore` 已排除后者；发布前仍应检查待提交文件，避免把密钥复制到代码、文档、截图或提交记录中。

别人克隆仓库在自己的电脑上运行时，可以复制 `.env.example` 为 `apps/api/.env`，填入**自己的** `OPENAI_API_KEY`，用自己的 API 账户启用真实 AI；不填则只能体验明确标注的 Demo Mode。请不要把真实 Key 写进 `VITE_` 前端变量或网页输入框。

这与访问一个已部署的网站不同：网站访客不会自动使用各自的 Key；如果站点服务端配置了你的 Key，访客的 AI 请求会消耗你的 API 额度。当前版本没有“每位访客自带密钥”的机制，因此在加入访问和用量控制前，不建议公开提供无限制的真实 AI 网站。

## 本机运行

要求 Node.js 22 或更高版本。

```bash
npm install
cp apps/api/.env.example apps/api/.env
npm run dev:all
```

如需真实 AI，在 `apps/api/.env` 中填写自己的 `OPENAI_API_KEY`。不填写时只能使用明确标注的 Demo Mode；真实输入不会生成模拟方案。

前端默认地址：`http://127.0.0.1:5173/`

本地 API 默认地址：`http://127.0.0.1:8787/`

若开发页面首次编译较慢，可停止开发服务后运行 `npm run preview:local`，打开 `http://127.0.0.1:4173/`。该命令先构建前端，再同时启动前端预览和本地 API；修改代码后需重新运行才能看到更新。

可配置的环境变量：

```text
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.6-terra
OPENAI_TRANSCRIBE_MODEL=gpt-transcribe
OPENAI_SEARCH_MODEL=gpt-5.6-luna
PORT=8787
```

## 验证

```bash
npm run typecheck
npm run test
npm run build
```

## Vercel 部署

仓库已经包含 Vercel Function 与单页应用路由配置。导入仓库后，在 Vercel Project Settings → Environment Variables 中配置 `OPENAI_API_KEY` 及所需模型变量，再重新部署即可启用真实 AI。

公开部署会消耗部署者的 OpenAI API 额度。正式公开给多人使用前，应增加访问控制、用量上限和可观测性；作品集演示阶段建议使用受控访问或 Demo Mode。

## 隐私边界

- 定位必须由用户主动触发；发送给天气服务前先做模糊化
- 原始图片和录音仅用于当次请求，不写入 Beauty Bag 或 Plan History
- Beauty Bag 和最近 5 次方案保存在用户自己的浏览器中
- AI 输出是美妆建议，不提供医学诊断

## 反馈与交流

欢迎通过 GitHub Issues 分享试用体验、错误复现步骤和产品建议。如果这个项目对你有启发，也欢迎 Star。请不要在公开 Issue 中上传私人照片、API Key 或其他敏感信息。

## 目录

- `apps/web`：移动端前端与页面
- `apps/api`：本机 BFF 与线上函数共用的接口实现
- `api`：Vercel Function 入口
- `packages/contracts`：前后端共享数据类型
- `docs`：实施计划与开发说明

## 项目状态

当前仍在本机进行核心流程与移动端验收，尚未公开部署。开源许可证尚未选择；在许可证确认前，代码默认保留全部权利。
