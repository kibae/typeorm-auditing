import { DataSource } from 'typeorm';
import { Case1, Case1Audit } from './entity/case1';
import { AuditingSubscriber } from '../decorator/auditing-entity.decorator';

(async function () {
    //Data Source
    const dataSource = await new DataSource({
        type: 'sqlite',
        database: ':memory:',
        synchronize: true,
        logging: 'all',
        entities: [Case1, Case1Audit],
        subscribers: [AuditingSubscriber],
    }).initialize();

    //Create
    const entity = await dataSource.manager.save(
        Case1.create({
            firstName: 'Timber',
            lastName: 'Saw',
            age: 25,
        })
    );

    //Update
    entity.age++;
    await entity.save();

    //Delete
    await entity.remove();

    //!!!! Print history entities
    console.log(await dataSource.manager.find(Case1Audit));
})();
