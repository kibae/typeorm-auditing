import { AuditingAction } from '../decorator/auditing-entity.decorator';
import { testConnection } from './test-common';
import { In } from 'typeorm';
import { Case3, Case3Audit, Case3Parent } from './entity/case3';

describe('AuditingEntity - Case3', () => {
    beforeEach(async () => {
        const dataSource = await testConnection([]);
        await dataSource.query(`DROP TABLE IF EXISTS case3_audit CASCADE`);
        await dataSource.query(`DROP TABLE IF EXISTS case3 CASCADE`);
        await dataSource.query(`DROP TABLE IF EXISTS case3_parent CASCADE`);
        await dataSource.destroy();
    });

    it('Case3(Inheritance + ManyToOne + JoinColumn)', async () => {
        const dataSource = await testConnection([Case3Parent, Case3, Case3Audit]);

        const parents = await dataSource.getRepository(Case3Parent).save([{ name: 'Parent1' }, { name: 'Parent2' }, { name: 'Parent3' }]);

        const entities = await dataSource.getRepository(Case3).save([
            {
                firstName: 'Timber1',
                lastName: 'Saw',
                age: 25,
                parent: parents[0],
            },
            {
                firstName: 'Timber2',
                lastName: 'Saw',
                age: 26,
                parent: parents[1],
            },
            {
                firstName: 'Timber3',
                lastName: 'Saw',
                age: 27,
                parent: parents[2],
            },
        ]);
        expect(entities).toBeDefined();
        console.log(entities);

        //Create
        const created = await dataSource.manager.find(Case3Audit, {
            where: { _action: AuditingAction.Create, firstName: In(['Timber1', 'Timber2', 'Timber3']) },
            order: { _seq: 'ASC' },
            relations: ['parent'],
        });
        console.log(created);
        expect(created).toBeDefined();
        expect(created.length).toBeGreaterThan(0);
        expect(created[0]._action).toBe(AuditingAction.Create);
        expect(created[0].id).toBe(entities[0].id);
        expect(created[0].parent.id).toBe(entities[0].parent.id);
        expect(created[1].id).toBe(entities[1].id);
        expect(created[1].parent.id).toBe(entities[1].parent.id);
        expect(created[2].id).toBe(entities[2].id);
        expect(created[2].parent.id).toBe(entities[2].parent.id);

        //Update
        entities[0].age = 100;
        await dataSource.getRepository(Case3).save(entities[0]);
        const updated = await dataSource.manager.find(Case3Audit, {
            where: { _action: AuditingAction.Update, id: entities[0].id },
            relations: ['parent'],
        });
        console.log(updated);
        expect(updated[0].id).toBe(entities[0].id);
        expect(updated[0].age).toBe(100);
        expect(updated[0].parent.id).toBe(entities[0].parent.id);

        await dataSource.destroy();
    });
});
