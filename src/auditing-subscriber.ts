import { EntitySubscriberInterface, EventSubscriber, InsertEvent, RemoveEvent, SoftRemoveEvent, UpdateEvent, EntityManager } from 'typeorm';
import { AuditingAction } from './decorator/auditing-entity.decorator';

@EventSubscriber()
export class AuditingSubscriber implements EntitySubscriberInterface {
    private static subscribers: Array<{ origin: Function; target: Function }> = [];

    static Subscribe(origin: Function, target: Function) {
        AuditingSubscriber.subscribers.push({ origin, target });
    }

    private async saveHistory(entityType: Function | string, manager: EntityManager, entity: any, action: AuditingAction): Promise<any> {
        const target = AuditingSubscriber.subscribers.find((item) => item.origin === entityType)?.target;
        if (!target) return;

        await manager.save(target, { ...entity, _action: action });
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
