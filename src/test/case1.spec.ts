import { AuditingAction } from '../decorator/auditing-entity.decorator';
import { Case1, Case1Audit } from './entity/case1';
import { testConnection } from './test-common';

describe('AuditingEntity - Case1', () => {
    beforeEach(async () => {
        const dataSource = await testConnection([]);
        await dataSource.query(`DROP TABLE IF EXISTS case1_audit CASCADE`);
        await dataSource.query(`DROP TABLE IF EXISTS case1 CASCADE`);
        await dataSource.destroy();
    });

    it('Case1(Inheritance) - CUD', async () => {
        const dataSource = await testConnection([Case1, Case1Audit]);

        const dummyDate = new Date('2000-01-01');
        const entity = await dataSource.manager.save(
            Case1.create({
                firstName: 'Timber',
                lastName: 'Saw',
                age: 25,
                createdAt: dummyDate,
                updatedAt: dummyDate,
                deletedAt: dummyDate,
            } as Case1)
        );
        expect(entity).toBeDefined();

        //Create
        const created = await dataSource.manager.find(Case1Audit);
        expect(created).toBeDefined();
        expect(created.length).toBeGreaterThan(0);
        expect(created[0]._action).toBe(AuditingAction.Create);
        expect(created[0].id).toBe(entity.id);

        //Update
        entity.age++;
        await entity.save();

        const updated = await dataSource.manager.find(Case1Audit, { where: { _action: AuditingAction.Update } });
        expect(updated).toBeDefined();
        expect(updated.length).toBeGreaterThan(0);
        expect(updated[0]._action).toBe(AuditingAction.Update);
        expect(updated[0].id).toBe(entity.id);
        console.log(updated);

        //Delete
        const originId = entity.id;
        await entity.remove();
        const deleted = await dataSource.manager.find(Case1Audit, { where: { _action: AuditingAction.Delete } });
        expect(deleted).toBeDefined();
        expect(deleted.length).toBeGreaterThan(0);
        expect(deleted[0]._action).toBe(AuditingAction.Delete);
        expect(deleted[0].id).toBe(originId);

        await dataSource.destroy();
    });
});
