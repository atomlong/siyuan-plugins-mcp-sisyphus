import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { getWorkspaceApiUrl } from '@/shared/workspace-api-url';

// Exercise the configuration generator that the Svelte copy buttons use.
const source = readFileSync(resolve('src/ui/setting/mcp-config/HttpServerPanel.svelte'), 'utf8');
const functions = ['getStdioServerConfig', 'getSiYuanApiUrl'].map(name => {
    const start = source.indexOf(`    function ${name}(`);
    return source.slice(start, source.indexOf('\n    }', start) + 6);
}).join('\n');
const generate = new Function('window', 'getWorkspaceApiUrl', 'getWorkspaceScriptPath', 'getSiYuanApiToken',
    ts.transpileModule(functions, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText + '\nreturn getStdioServerConfig(true);');

describe('workspace-specific connection snippets', () => {
    it('keeps each workspace URL, token and server path paired', () => {
        for (const [port, workspace, token] of [[56602, 'SiYuan', 'first-token'], [58134, 'SiYuanDev', 'second-token']] as const) {
            const script = `/workspaces/${workspace}/data/plugins/sisyphus/mcp-server.cjs`;
            const config = generate({ location: { origin: `https://127.0.0.1:${port}` } }, getWorkspaceApiUrl, () => script, () => token);
            expect(JSON.parse(JSON.stringify(config))).toEqual({
                command: 'node', args: [script], type: 'stdio',
                env: { SIYUAN_API_URL: `http://127.0.0.1:${port}`, SIYUAN_TOKEN: token },
            });
        }
    });

    it('does not guess port 6806 when the workspace origin is unavailable', () => {
        expect(() => generate({ location: { origin: 'null' } }, getWorkspaceApiUrl, () => '/server.cjs', () => 'test-token'))
            .toThrow('current SiYuan workspace API origin');
    });
});
