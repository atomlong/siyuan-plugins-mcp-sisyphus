# Troubleshooting

This page groups common failures and quick checks for MCP connectivity.

When to read this page: the server does not start, tools are not visible, or calls fail after connection.

Related pages:

- [Deployment](./deployment.md)
- [HTTPS](./https.md)

## Connection Failed

Check these first:

- Is SiYuan running and its API reachable on `6806`?
- Is the plugin enabled?
- If using HTTP, is the MCP server started on `36806`?
- If using stdio, is the `mcp-server.cjs` path correct and readable from the MCP client machine?
- In Docker setups, do not use a container-only path like `/siyuan/workspace/data/plugins/.../mcp-server.cjs` unless that path is mounted on the client machine. Copy `mcp-server.cjs` to a client-side path or extract it from the release package.

## Tools Not Visible

- Confirm the client is connected to the MCP endpoint
- Confirm the plugin-side tool config did not disable the tool
- If using HTTP, restart the MCP server after settings changes

## Calls Fail After Connection

- Verify bearer token or `SIYUAN_TOKEN`
- Verify notebook permissions for the target notebook
- Confirm you are using the right path type for document actions

## Permission Denied

Permission levels:

- `rwd`: read, write, delete
- `rw`: read, write
- `r`: read only
- `none`: no access

If a call fails, check both:

- notebook-level permission config
- whether the action itself is high-risk or disabled

## Logs and Quick Reference

Default ports:

- SiYuan API: `6806`
- MCP HTTP: `36806`

Useful locations:

- Plugin bundle: `{workspace}/data/plugins/siyuan-plugins-mcp-sisyphus/`
- `mcp-server.cjs`: same directory as the plugin bundle

Common stdio error:

- `Failed to reconnect ... -32000`: often means the MCP client could not start `mcp-server.cjs` or the server could not reach `SIYUAN_API_URL`. For Docker, first check that `args` points to a client-side file path and `SIYUAN_API_URL` points to the reachable SiYuan API endpoint, usually `http://<docker-host-ip>:6806`.

Desktop HTTP MCP uses the current workspace window’s actual API origin, including random ports, and refuses to start when that origin is unavailable. HTTP 401 means authentication failure, 403 means HTTP access denied, and 429 means rate limiting; these responses no longer instruct users to start SiYuan. Standalone deployments still use `SIYUAN_API_URL`. The copied AI setup prompt asks for global versus project/workspace scope before updating configuration.
