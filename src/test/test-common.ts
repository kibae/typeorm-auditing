import { DataSource } from 'typeorm';
import { AuditingSubscriber } from '../auditing-subscriber';

export async function testConnection(entities: any[]): Promise<DataSource> {
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
