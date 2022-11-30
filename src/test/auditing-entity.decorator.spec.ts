import { AbstractAuditingBaseEntity, AuditingEntity } from '../decorator/auditing-entity.decorator';
import { getMetadataArgsStorage } from 'typeorm';
import * as assert from 'assert';
import { Case1Audit } from './entity/case1';
import { Case2Audit } from './entity/case2';
import { Case3Audit } from './entity/case3';
import { Case4Audit } from './entity/case4';

describe('AuditingEntity', () => {
    beforeAll(() => {
        assert.ok(Case1Audit);
        assert.ok(Case2Audit);
        assert.ok(Case1Audit);
        assert.ok(Case4Audit);
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

    it('Case3(Inheritance + Relation)', async () => {
        expect(getMetadataArgsStorage().tables.find((table) => table.target === Case3Audit)).toBeDefined();
        for (const columnName of ['_seq', '_action', '_modifiedAt']) {
            expect(
                getMetadataArgsStorage().columns.find((column) => column.target === Case3Audit && column.propertyName === columnName)
            ).toBeDefined();
        }
        expect(getMetadataArgsStorage().indices.find((index) => index.target === Case3Audit)).toBeDefined();
        expect(getMetadataArgsStorage().generations.find((gen) => gen.target === Case3Audit && gen.propertyName === '_seq')).toBeDefined();
        expect(getMetadataArgsStorage().relations.find((gen) => gen.target === Case3Audit && gen.propertyName === 'parent')).toBeDefined();
    });

    it('Case4(Not inherited + Relation)', async () => {
        expect(getMetadataArgsStorage().tables.find((table) => table.target === Case4Audit)).toBeDefined();
        for (const columnName of ['_seq', '_action', '_modifiedAt']) {
            expect(
                getMetadataArgsStorage().columns.find((column) => column.target === Case4Audit && column.propertyName === columnName)
            ).toBeDefined();
        }
        expect(getMetadataArgsStorage().indices.find((index) => index.target === Case4Audit)).toBeDefined();
        expect(getMetadataArgsStorage().generations.find((gen) => gen.target === Case4Audit && gen.propertyName === '_seq')).toBeDefined();
        expect(getMetadataArgsStorage().relations.find((gen) => gen.target === Case4Audit && gen.propertyName === 'parent')).toBeDefined();
    });
});
