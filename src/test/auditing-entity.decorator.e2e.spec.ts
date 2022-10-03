import { AuditingAction } from '../decorator/auditing-entity.decorator';
import { DataSource, In } from 'typeorm';
import { Case1, Case1Audit } from './entity/case1';
import { Case2, Case2Audit, ChildCase2 } from './entity/case2';
import { AuditingSubscriber } from '../auditing-subscriber';

async function connection(entities: any[]): Promise<DataSource> {
    return await new DataSource({
        type: 'mysql',
        port: 53306,
        database: 'playground',
        username: 'root',
        password: 'local',
        synchronize: true,
        logging: 'all',
        entities,
        subscribers: [AuditingSubscriber],
    }).initialize();
}

describe('AuditingEntity - E2E', () => {
    beforeAll(async () => {
        const dataSource = await connection([Case1, Case1Audit, Case2, Case2Audit, ChildCase2]);
        await dataSource.query(`DELETE FROM case1_audit`);
        await dataSource.query(`DELETE FROM case1`);
        await dataSource.query(`DELETE FROM child_case2`);
        await dataSource.query(`DELETE FROM case2_audit`);
        await dataSource.query(`DELETE FROM case2`);
        await dataSource.destroy();
    });

    it('Case1(Inheritance) - CUD', async () => {
        const dataSource = await connection([Case1, Case1Audit]);

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

    it('Case2(Not inherited + ObjectLiteral + Partial) - CUD', async () => {
        const dataSource = await connection([ChildCase2, Case2, Case2Audit]);

        const entity = new Case2();
        entity.firstName = 'Timber';
        entity.lastName = 'Saw';
        entity.age = 25;

        await dataSource.manager.save(entity);
        expect(entity).toBeDefined();

        //Create
        const created = await dataSource.manager.find(Case2Audit);
        expect(created).toBeDefined();
        expect(created.length).toBeGreaterThan(0);
        expect(created[0]._action).toBe(AuditingAction.Create);
        expect(created[0].id).toBe(entity.id);

        //Update
        entity.age++;
        await dataSource.manager.save(entity);

        const updated = await dataSource.manager.find(Case2Audit, { where: { _action: AuditingAction.Update } });
        expect(updated).toBeDefined();
        expect(updated.length).toBeGreaterThan(0);
        expect(updated[0]._action).toBe(AuditingAction.Update);
        expect(updated[0].id).toBe(entity.id);

        //Delete
        const originId = entity.id;
        await dataSource.manager.remove(entity);
        const deleted = await dataSource.manager.find(Case2Audit, { where: { _action: AuditingAction.Delete } });
        expect(deleted).toBeDefined();
        expect(deleted.length).toBeGreaterThan(0);
        expect(deleted[0]._action).toBe(AuditingAction.Delete);
        expect(deleted[0].id).toBe(originId);

        await dataSource.destroy();
    });

    it('Case3(Not inherited + ObjectLiteral + Partial) - ObjectLiteral', async () => {
        const dataSource = await connection([ChildCase2, Case2, Case2Audit]);

        const entities = await dataSource.getRepository(Case2).save([
            {
                firstName: 'Timber1',
                lastName: 'Saw',
                age: 25,
            },
            {
                firstName: 'Timber2',
                lastName: 'Saw',
                age: 26,
            },
            {
                firstName: 'Timber3',
                lastName: 'Saw',
                age: 27,
            },
        ]);
        expect(entities).toBeDefined();
        console.log(entities);

        //Create
        const created = await dataSource.manager.find(Case2Audit, {
            where: { firstName: In(['Timber1', 'Timber2', 'Timber3']) },
            order: { _seq: 'ASC' },
        });
        console.log(created);
        expect(created).toBeDefined();
        expect(created.length).toBeGreaterThan(0);
        expect(created[0]._action).toBe(AuditingAction.Create);
        expect(created[0].id).toBe(entities[0].id);
        expect(created[1].id).toBe(entities[1].id);
        expect(created[2].id).toBe(entities[2].id);

        //check @BeforeInsert
        expect(created[0]._modifiedBy).toBe('Timber1 Saw');
        expect(created[1]._modifiedBy).toBe('Timber2 Saw');
        expect(created[2]._modifiedBy).toBe('Timber3 Saw');

        await dataSource.destroy();
    });
});
