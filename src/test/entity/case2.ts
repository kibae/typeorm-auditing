import { AfterLoad, BaseEntity, Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { AuditingAction, AuditingEntity, IAuditingEntity } from '../../decorator/auditing-entity.decorator';

abstract class MyBase1 extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;
}

@Entity()
export class Case2 extends MyBase1 {
    @Column()
    @Index()
    firstName!: string;

    @Column()
    lastName!: string;

    @Column()
    age!: number;

    public get fullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }

    public FullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }

    @AfterLoad()
    afterLoad() {
        console.log(this.age);
    }
}

@AuditingEntity(Case2, {
    //Set type to int for sqlite e2e test
    seqType: 'int',
})
export class Case2Audit extends BaseEntity implements IAuditingEntity {
    readonly _seq!: number;
    readonly _action!: AuditingAction;
    readonly _modifiedAt!: Date;

    @Column({ nullable: true })
    additionalColumn!: string;

    id!: number;
    firstName!: string;
    lastName!: string;
}
