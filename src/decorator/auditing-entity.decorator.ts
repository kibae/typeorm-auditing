import {
    Column,
    CreateDateColumn,
    EntitySubscriberInterface,
    EventSubscriber,
    getMetadataArgsStorage,
    InsertEvent,
    ObjectLiteral,
    PrimaryGeneratedColumn,
    RemoveEvent,
    SoftRemoveEvent,
    UpdateEvent,
} from 'typeorm';
import { EntityOptions } from 'typeorm/decorator/options/EntityOptions';
import { PrimaryGeneratedColumnType } from 'typeorm/driver/types/ColumnTypes';
import { EntityManager } from 'typeorm/entity-manager/EntityManager';
import { TableMetadataArgs } from 'typeorm/metadata-args/TableMetadataArgs';
import { MetadataUtils } from 'typeorm/metadata-builder/MetadataUtils';

export enum AuditingAction {
    Create = 'Create',
    Update = 'Update',
    Delete = 'Delete',
}

export interface AuditingEntityDefaultColumns {
    readonly _seq: number;
    readonly _action: AuditingAction;
    readonly _modifiedAt: Date;
}

/**
 * @deprecated Use AuditingEntityDefaultColumns instead of IAuditingEntity.
 */
export interface IAuditingEntity extends AuditingEntityDefaultColumns {}

export interface AuditingEntityOptions extends EntityOptions {
    /**
     * The type of *_seq* column can be specified.
     */
    seqType?: PrimaryGeneratedColumnType;
}

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

export abstract class AbstractAuditingBaseEntity implements AuditingEntityDefaultColumns {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    readonly _seq!: number;

    @Column('varchar', { length: 20 })
    readonly _action!: AuditingAction;

    @CreateDateColumn()
    readonly _modifiedAt!: Date;
}

export function AuditingEntity<T extends ObjectLiteral>(entityType: ObjectLiteral, options?: AuditingEntityOptions) {
    return (target: Function) => {
        options = options || {};

        const { seqType, ...entityOptions } = options;

        const metadata = getMetadataArgsStorage();
        const origin = metadata.tables.find((table) => table.target === entityType);
        if (!origin) throw new Error('AuditingEntity: Cannot found origin entity from TypeORM metadata.');
        if (origin.type !== 'regular') throw new Error('AuditingEntity: Origin entity must be a regular entity type.');

        let dummyInherited = false;
        if (MetadataUtils.getInheritanceTree(target).includes(origin.target as Function)) {
            //Break inheritance. Avoid inheritance of index and event definitions
            Object.setPrototypeOf(target, AbstractAuditingBaseEntity);
            dummyInherited = true;
        }

        //create table
        metadata.tables.push({
            target,
            name: entityOptions.name,
            type: 'regular',
            orderBy: entityOptions.orderBy || origin.orderBy,
            engine: entityOptions.engine || origin.engine,
            database: entityOptions.database || origin.database,
            schema: entityOptions.schema || origin.schema,
            synchronize: entityOptions.synchronize || origin.synchronize,
            withoutRowid: entityOptions.withoutRowid,
        } as TableMetadataArgs);

        const inheritanceTree = MetadataUtils.getInheritanceTree(origin.target as Function);
        const pkList: string[] = [];
        //import columns of origin table
        metadata.columns
            .filter((column) => inheritanceTree.includes(column.target as Function))
            .map((originColumn) => {
                const { type, length, array, hstoreType, enumName, precision, scale, zerofill, comment, primary } =
                    originColumn.options || {};
                if (primary) pkList.push(originColumn.propertyName);

                metadata.columns.push({
                    target,
                    propertyName: originColumn.propertyName,
                    mode: 'regular',
                    options: {
                        nullable: true,
                        type,
                        length,
                        array,
                        hstoreType,
                        enumName,
                        precision,
                        scale,
                        zerofill,
                        comment,
                    },
                });
            });

        //generate index for origin PKs
        if (pkList.length > 0)
            metadata.indices.push({
                target,
                columns: pkList,
            });

        //If the dummy class is not inherited, columns for history should be created.
        if (!dummyInherited) {
            //_seq
            metadata.columns.push({
                target,
                propertyName: '_seq',
                mode: 'regular',
                options: { type: seqType || 'bigint', primary: true },
            });
            metadata.generations.push({ target, propertyName: '_seq', strategy: 'increment' });

            //_action
            metadata.columns.push({
                target,
                propertyName: '_action',
                mode: 'regular',
                options: { type: 'varchar', length: 20 },
            });

            //_modifiedAt
            metadata.columns.push({ target, propertyName: '_modifiedAt', mode: 'createDate', options: {} });
        } else if (seqType && seqType !== 'bigint') {
            //The type of *_seq* column can be specified.

            //_seq
            metadata.columns.unshift({
                target,
                propertyName: '_seq',
                mode: 'regular',
                options: { type: seqType, primary: true },
            });
            metadata.generations.push({ target, propertyName: '_seq', strategy: 'increment' });
        }

        //entityListeners
        AuditingSubscriber.Subscribe(origin.target as Function, target);
    };
}
