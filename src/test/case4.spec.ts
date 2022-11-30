import { AuditingAction } from '../decorator/auditing-entity.decorator';
import { testConnection } from './test-common';
import { In } from 'typeorm';
import { Case4, Case4Audit, Case4Parent } from './entity/case4';

describe('AuditingEntity - Case4', () => {
    beforeEach(async () => {
        const dataSource = await testConnection([]);
        await dataSource.query(`DROP TABLE IF EXISTS case4_audit CASCADE`);
        await dataSource.query(`DROP TABLE IF EXISTS case4 CASCADE`);
        await dataSource.query(`DROP TABLE IF EXISTS case4_parent CASCADE`);
        await dataSource.destroy();
    });

    it('Case4(Not inherited + ObjectLiteral + ManyToOne + JoinColumn)', async () => {
        const dataSource = await testConnection([Case4Parent, Case4, Case4Audit]);

        const parents = await dataSource.getRepository(Case4Parent).save([{ name: 'Parent1' }, { name: 'Parent2' }, { name: 'Parent3' }]);

        const entities = await dataSource.getRepository(Case4).save([
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
        const created = await dataSource.manager.find(Case4Audit, {
            where: { firstName: In(['Timber1', 'Timber2', 'Timber3']) },
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

        await dataSource.destroy();
    });
});
