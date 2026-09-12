import { describe, expect, it } from 'vitest';

import { AV_FILTER_MAX_DEPTH } from '@/core/types';
import { AV_VARIANTS } from '@/tools/av';

const setFiltersVariant = AV_VARIANTS.find((variant) => variant.action === 'set_filters');

// GLM-5.3's upstream inliner rejects recursive $refs with
// "tools.function.parameters: recursive $ref ... cannot be inlined",
// so the filter-tree schema must stay depth-bounded and $ref-free.
describe('av set_filters schema depth bounding', () => {
    it('exposes the set_filters variant', () => {
        expect(setFiltersVariant).toBeDefined();
    });

    it('emits a JSON schema without $ref/$defs', () => {
        const serialized = JSON.stringify(setFiltersVariant!.schema);
        expect(serialized).not.toContain('$ref');
        expect(serialized).not.toContain('$defs');
    });

    it('allows exactly AV_FILTER_MAX_DEPTH filter levels and stops nesting there', () => {
        let wrapper = (setFiltersVariant!.schema as any).properties.filters;
        let depth = 0;
        while (wrapper) {
            depth += 1;
            wrapper = wrapper.items?.properties?.filters;
        }
        expect(depth).toBe(AV_FILTER_MAX_DEPTH);
    });

    it('accepts a leaf-only filter tree', () => {
        setFiltersVariant!.validate({
            action: 'set_filters',
            avID: 'av-1',
            blockID: 'block-1',
            viewID: 'view-1',
            filters: [{ column: 'col-1', operator: 'Contains' }],
        });
    });

    it('accepts a tree nested exactly AV_FILTER_MAX_DEPTH levels', () => {
        let filter: Record<string, unknown> = { column: 'col-1', operator: 'Contains' };
        for (let level = 1; level < AV_FILTER_MAX_DEPTH; level++) {
            filter = { combination: 'and', filters: [filter] };
        }
        setFiltersVariant!.validate({
            action: 'set_filters',
            avID: 'av-1',
            blockID: 'block-1',
            viewID: 'view-1',
            filters: [filter],
        });
    });

    it('rejects a tree nested beyond AV_FILTER_MAX_DEPTH levels', () => {
        let filter: Record<string, unknown> = { column: 'col-1', operator: 'Contains' };
        for (let level = 0; level < AV_FILTER_MAX_DEPTH; level++) {
            filter = { combination: 'and', filters: [filter] };
        }
        expect(() => setFiltersVariant!.validate({
            action: 'set_filters',
            avID: 'av-1',
            blockID: 'block-1',
            viewID: 'view-1',
            filters: [filter],
        })).toThrow();
    });
});
