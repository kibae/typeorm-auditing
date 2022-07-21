import { AuditingAction, AuditingSubscriber } from '../decorator/auditing-entity.decorator';
import { DataSource } from 'typeorm';
import { Case1, Case1Audit } from './entity/case1';
import { Case2, Case2Audit } from './entity/case2';

describe('AuditingEntity - E2E', () => {
    it('Case1(Inheritance) - CUD', async () => {
        const dataSource = await new DataSource({
            type: 'sqlite',
            database: ':memory:',
            synchronize: true,
            logging: 'all',
            entities: [Case1, Case1Audit],
            subscribers: [AuditingSubscriber],
        }).initialize();

        const entity = await dataSource.manager.save(
            Case1.create({
                firstName: 'Timber',
                lastName: 'Saw',
                age: 25,
            })
        );
        expect(entity).toBeDefined();

        //Create
        const created = await dataSource.manager.find(Case1Audit);
        expect(created).toBeDefined();
        expect(created.length > 0).toBeDefined();
        expect(created[0]._action === AuditingAction.Create).toBeDefined();
        expect(created[0].id === entity.id).toBeDefined();

        //Update
        entity.age++;
        await entity.save();

        const updated = await dataSource.manager.find(Case1Audit, { where: { _action: AuditingAction.Update } });
        expect(updated).toBeDefined();
        expect(updated.length > 0).toBeDefined();
        expect(updated[0]._action === AuditingAction.Update).toBeDefined();
        expect(updated[0].id === entity.id).toBeDefined();

        //Delete
        await entity.remove();
        const deleted = await dataSource.manager.find(Case1Audit, { where: { _action: AuditingAction.Delete } });
        expect(deleted).toBeDefined();
        expect(deleted.length > 0).toBeDefined();
        expect(deleted[0]._action === AuditingAction.Update).toBeDefined();
        expect(deleted[0].id === entity.id).toBeDefined();
    });

    it('Case2(Not inherited + Partial) - CUD', async () => {
        const dataSource = await new DataSource({
            type: 'sqlite',
            database: ':memory:',
            synchronize: true,
            logging: 'all',
            entities: [Case2, Case2Audit],
            subscribers: [AuditingSubscriber],
        }).initialize();

        const entity = await dataSource.manager.save(
            Case2.create({
                firstName: 'Timber',
                lastName: 'Saw',
                age: 25,
            })
        );
        expect(entity).toBeDefined();

        //Create
        const created = await dataSource.manager.find(Case2Audit);
        expect(created).toBeDefined();
        expect(created.length > 0).toBeDefined();
        expect(created[0]._action === AuditingAction.Create).toBeDefined();
        expect(created[0].id === entity.id).toBeDefined();

        //Update
        entity.age++;
        await entity.save();

        const updated = await dataSource.manager.find(Case2Audit, { where: { _action: AuditingAction.Update } });
        expect(updated).toBeDefined();
        expect(updated.length > 0).toBeDefined();
        expect(updated[0]._action === AuditingAction.Update).toBeDefined();
        expect(updated[0].id === entity.id).toBeDefined();

        //Delete
        await entity.remove();
        const deleted = await dataSource.manager.find(Case2Audit, { where: { _action: AuditingAction.Delete } });
        expect(deleted).toBeDefined();
        expect(deleted.length > 0).toBeDefined();
        expect(deleted[0]._action === AuditingAction.Update).toBeDefined();
        expect(deleted[0].id === entity.id).toBeDefined();
    });
});
