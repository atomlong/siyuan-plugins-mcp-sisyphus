# 故障排查

这个页面汇总了 MCP 连接和调用的常见问题，以及最快的检查路径。

适用场景：服务起不来、工具不显示，或者连接成功后调用失败。

相关页面：

- [部署指南](./deployment.md)
- [HTTPS 配置](./https.md)

## 连接失败

先检查：

- 思源是否正在运行，`6806` API 是否可访问
- 插件是否已启用
- 如果使用 HTTP，MCP 服务是否已在 `36806` 启动
- 如果使用 stdio，`mcp-server.cjs` 路径是否正确，并且是否能被 MCP 客户端所在机器读取
- Docker 场景下，不要直接使用 `/siyuan/workspace/data/plugins/.../mcp-server.cjs` 这类仅容器内可见的路径，除非该路径也挂载到了客户端机器。请把 `mcp-server.cjs` 复制到客户端侧路径，或从 release package 中解压

## 工具不可见

- 确认客户端真的连上了 MCP 端点
- 确认插件侧工具配置没有禁用对应工具
- 如果刚改过设置，重启一次 MCP 服务

## 连接成功但调用失败

- 检查 bearer token 或 `SIYUAN_TOKEN`
- 检查目标笔记本的权限配置
- 检查文档相关 action 是否使用了正确的路径类型

## 权限被拒绝

权限级别：

- `rwd`：读写删
- `rw`：读写
- `r`：只读
- `none`：无权限

调用失败时同时检查：

- 笔记本级权限设置
- 该 action 是否属于高危操作或已被禁用

## 日志与快速参考

默认端口：

- 思源 API：`6806`
- MCP HTTP：`36806`

常见路径：

- 插件目录：`{workspace}/data/plugins/siyuan-plugins-mcp-sisyphus/`
- `mcp-server.cjs`：与插件 bundle 同目录

常见 stdio 错误：

- `Failed to reconnect ... -32000`：通常表示 MCP 客户端无法启动 `mcp-server.cjs`，或 server 无法访问 `SIYUAN_API_URL`。Docker 场景下先检查 `args` 是否指向客户端侧文件路径，以及 `SIYUAN_API_URL` 是否指向可访问的思源 API 地址，通常是 `http://<docker-host-ip>:6806`。

桌面 HTTP MCP 使用当前工作区窗口的实际 API origin，包括随机端口；无法确定 origin 时拒绝启动。401 表示认证失败，403 表示 HTTP 访问被拒绝，429 表示限流；这些响应不再提示“启动思源”。独立部署仍使用 `SIYUAN_API_URL`。复制给 AI 的配置说明会要求先明确全局或项目／工作区范围，再修改对应配置。
