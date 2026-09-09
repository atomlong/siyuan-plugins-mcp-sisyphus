import { describe, expect, it } from 'vitest';

import { ACTIONS_BY_CATEGORY, buildDefaultToolConfig, TOOL_CATEGORIES } from '@/core/config';
import { AGENT_MEMORY_TOOL_DESCRIPTION_REMINDER, listAllTools, USER_RULES_TOOL_DESCRIPTION_REMINDER } from '@/core/tool-registry';

describe('tool registry', () => {
    it.each([false, true])('keeps every local schema reference resolvable with strict writes %s', (strict) => {
        const config = buildDefaultToolConfig();
        config.writeSafety.strictMode = strict;
        for (const category of TOOL_CATEGORIES) {
            config[category].enabled = true;
            for (const action of ACTIONS_BY_CATEGORY[category]) config[category].actions[action] = true;
        }
        for (const tool of listAllTools(config)) {
            const root = JSON.parse(JSON.stringify(tool.inputSchema));
            const visit = (node: any) => {
                if (!node || typeof node !== 'object') return;
                if (typeof node.$ref === 'string') {
                    expect(node.$ref.startsWith('#'), tool.name).toBe(true);
                    const target = node.$ref === '#' ? root : node.$ref.slice(2).split('/').reduce(
                        (value: any, key: string) => value?.[key.replace(/~1/g, '/').replace(/~0/g, '~')], root,
                    );
                    expect(target, `${tool.name}: ${node.$ref}`).toBeDefined();
                }
                Object.values(node).forEach(visit);
            };
            visit(root);
        }
    });

    it('omits the user rules reminder when no user rules are configured', () => {
        const config = buildDefaultToolConfig();
        config.userRulesText = '';

        const tools = listAllTools(config);

        expect(tools.length).toBeGreaterThan(0);
        expect(tools.every((tool) => !tool.description?.includes(USER_RULES_TOOL_DESCRIPTION_REMINDER))).toBe(true);
    });

    it('always adds a light agent memory reminder without embedding memory content', () => {
        const config = buildDefaultToolConfig();
        config.userRulesText = '';
        config.agentSiyuanMemoryText = 'Workspace has Inbox and Projects notebooks.';

        const tools = listAllTools(config);

        expect(tools.length).toBeGreaterThan(0);
        expect(tools.every((tool) => tool.description?.includes(AGENT_MEMORY_TOOL_DESCRIPTION_REMINDER))).toBe(true);
        expect(tools.every((tool) => !tool.description?.includes('Workspace has Inbox and Projects notebooks.'))).toBe(true);
    });

    it('adds a light user rules reminder when user rules are configured', () => {
        const config = buildDefaultToolConfig();
        config.userRulesText = 'Always set icons.';

        const tools = listAllTools(config);

        expect(tools.length).toBeGreaterThan(0);
        expect(tools.every((tool) => tool.description?.includes(USER_RULES_TOOL_DESCRIPTION_REMINDER))).toBe(true);
    });
});
