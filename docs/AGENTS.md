# Repository Guidelines

## 项目结构与模块组织
- 源码位于 src/，按领域/功能分层（如 src/auth/, src/lib/）。
- 测试与源码镜像：tests/ 或就近（如 src/foo/foo.spec.ts、tests/test_foo.py）。
- 资源在 assets/ 或 public/；脚本在 scripts/；CI/编辑器配置在 .github/、.vscode/、.editorconfig。
- 提供 .env.example；严禁提交真实密钥。

## 构建、测试与本地运行
- Node: npm ci；npm run dev（本地调试）；npm run build；npm test
- Python: pip install -r requirements.txt 或 poetry install；pytest
- Go: go build ./...；go test ./...
- 质量检查：npm run lint；npm run format 或 black . && isort .
- 若有 Makefile：make build；make test

## 代码风格与命名
- 缩进：JS/TS 2 空格；Python 4 空格；建议行宽≤100。
- 命名：Class/Type 用 PascalCase；变量/函数 camelCase；Python 用 snake_case；脚本/配置用 kebab-case。
- 模块小而内聚，纯函数优先；提交前本地 lint/format 通过。

## 测试规范
- 单测覆盖每个模块，边界/集成测试补充；目标覆盖率≥80%（视项目调整）。
- 命名：*.spec.ts / *.test.ts；test_*.py；*_test.go。
- 常用命令：npm test -- --watch；pytest -q；go test ./...

## 提交与 PR
- 建议 Conventional Commits：
  - feat(auth): 支持刷新 Token
  - fix: 处理空输入崩溃
  - docs(readme): 补充安装说明
- PR 需包含：变更说明、关联 Issue（Fixes #123）、必要截图/日志、测试结果与通过的 lint；保持小而可审。

## 安全与配置
- 使用 .env 与 .env.example；密钥存放于密管/CI Secrets，不入库。
- 依赖审计：npm audit；pip-audit；go vet/go mod verify。
