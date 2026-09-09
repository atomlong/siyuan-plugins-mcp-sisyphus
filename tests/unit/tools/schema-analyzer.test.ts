import { describe, expect, it } from 'vitest';

import {
    mergePropertySchemas,
    normalizeJsonSchema,
} from '@/tools/internal/schema-analyzer';
import { createActionSchema } from '@/tools/internal/shared';
import { buildAggregatedTool } from '@/tools/internal/shared';

describe('schema-analyzer helpers', () => {
    it('isolates recursive definitions from different actions without mutating the source', () => {
        const variants = ['set_filters', 'set_sorts'].map((action) => ({
            action,
            schema: createActionSchema(action, {
                [action]: { $ref: '#/$defs/__schema0' },
            }, []),
        }));
        for (const variant of variants) variant.schema.$defs = {
            __schema0: { type: 'object', properties: {
                value: { const: variant.action },
                children: { type: 'array', items: { $ref: '#/$defs/__schema0' } },
            } },
        };
        const schema = buildAggregatedTool('av', '', {
            enabled: true, actions: { set_filters: true, set_sorts: true },
        }, variants)[0].inputSchema;
        for (const { action } of variants) {
            expect(schema.properties[action].$ref).toBe(`#/$defs/${action}/$defs/__schema0`);
            const definition = schema.$defs[action].$defs.__schema0;
            expect(definition.properties.value.const).toBe(action);
            expect(definition.properties.children.items.$ref).toBe(`#/$defs/${action}/$defs/__schema0`);
        }
        expect(variants[0].schema.properties.set_filters.$ref).toBe('#/$defs/__schema0');
    });

    it('merges property descriptions and annotations without changing nested schemas', () => {
        const merged = mergePropertySchemas([
            createActionSchema('append', {
                parentID: { type: 'string', description: 'Parent ID' },
                items: { type: 'array', items: { type: 'string' }, description: 'Values' },
            }, ['parentID']),
            createActionSchema('update', {
                parentID: { type: 'string', description: 'Parent ID' },
            }, []),
        ].map((schema, index) => ({ action: index === 0 ? 'append' : 'update', schema })));

        expect((merged.parentID as Record<string, unknown>).description).toBe('Parent ID [Required by: append; Optional in: update]');
        expect((merged.items as Record<string, unknown>).items).toEqual({ type: 'string' });
    });

    it('normalizes nested array item schemas', () => {
        const schema = normalizeJsonSchema({
            type: 'object',
            properties: {
                values: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            tags: { type: 'array' },
                        },
                    },
                },
            },
        }) as Record<string, any>;

        expect(schema.properties.values.items.properties.tags.items).toEqual({ type: 'string' });
    });
});
