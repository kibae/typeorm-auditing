import {
    EntitySubscriberInterface,
    EventSubscriber,
    InsertEvent,
    RemoveEvent,
    SoftRemoveEvent,
    UpdateEvent,
    EntityManager,
    BaseEntity,
} from 'typeorm';
import { AuditingAction } from './decorator/auditing-entity.decorator';
import { MetadataUtils } from 'typeorm/metadata-builder/MetadataUtils';

type ClassType = { new (): any };

@EventSubscriber()
export class AuditingSubscriber implements EntitySubscriberInterface {
    private static subscribers: Array<{ origin: Function; target: Function }> = [];

    static Subscribe(origin: Function, target: Function) {
        AuditingSubscriber.subscribers.push({ origin, target });
    }

    private async saveHistory(entityType: Function | string, manager: EntityManager, entity: any, action: AuditingAction): Promise<any> {
        const target = AuditingSubscriber.subscribers.find((item) => item.origin === entityType)?.target;
        if (!target) return;

        // If target(audit entity) is a class that inherits from BaseEntity, instantiate it.
        // Without this process, listeners such as @BeforeInsert do not work.
        if (MetadataUtils.getInheritanceTree(target).includes(BaseEntity))
            await manager.save((target as typeof BaseEntity).create({ ...entity, _action: action }));
        else {
            const replica = new (target as any as ClassType)();
            Object.assign(replica, { ...entity, _action: action });
            await manager.save(target, replica);
        }
    }

    async afterInsert(event: InsertEvent<any>): Promise<any> {
        return this.saveHistory(event.metadata.target, event.manager, event.entity, AuditingAction.Create);
    }

    async afterUpdate(event: UpdateEvent<any>): Promise<any> {
        return this.saveHistory(event.metadata.target, event.manager, event.entity, AuditingAction.Update);
    }

    async afterRemove(event: RemoveEvent<any>): Promise<any> {
        return this.saveHistory(event.metadata.target, event.manager, event.databaseEntity, AuditingAction.Delete);
    }

    async afterSoftRemove(event: SoftRemoveEvent<any>): Promise<any> {
        return this.afterRemove(event);
    }
}
