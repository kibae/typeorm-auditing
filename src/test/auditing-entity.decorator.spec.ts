import { AbstractAuditingBaseEntity, AuditingEntity } from '../decorator/auditing-entity.decorator';
import { getMetadataArgsStorage } from 'typeorm';
import * as assert from 'assert';
import { Case1Audit } from './entity/case1';
import { Case2Audit } from './entity/case2';

describe('AuditingEntity', () => {
    beforeAll(() => {
        assert.ok(Case1Audit);
        assert.ok(Case2Audit);
    });

    it('Case1(Inheritance)', async () => {
        expect(getMetadataArgsStorage().tables.find((table) => table.target === Case1Audit)).toBeDefined();
        for (const columnName of ['_seq', '_action', '_modifiedAt']) {
            expect(
                getMetadataArgsStorage().columns.find(
                    (column) => column.target === AbstractAuditingBaseEntity && column.propertyName === columnName
                )
            ).toBeDefined();
        }
        expect(getMetadataArgsStorage().indices.find((index) => index.target === Case1Audit)).toBeDefined();
        expect(
            getMetadataArgsStorage().generations.find((gen) => gen.target === AbstractAuditingBaseEntity && gen.propertyName === '_seq')
        ).toBeDefined();
    });

    it('Case2(Not inherited + Partial)', async () => {
        expect(getMetadataArgsStorage().tables.find((table) => table.target === Case2Audit)).toBeDefined();
        for (const columnName of ['_seq', '_action', '_modifiedAt', 'additionalColumn']) {
            expect(
                getMetadataArgsStorage().columns.find((column) => column.target === Case2Audit && column.propertyName === columnName)
            ).toBeDefined();
        }
        expect(getMetadataArgsStorage().indices.find((index) => index.target === Case2Audit)).toBeDefined();
        expect(getMetadataArgsStorage().generations.find((gen) => gen.target === Case2Audit && gen.propertyName === '_seq')).toBeDefined();
    });

    it('Case2(Listener)', async () => {
        expect(getMetadataArgsStorage().entityListeners.find((table) => table.target === Case2Audit)).toBeDefined();
    });
});
