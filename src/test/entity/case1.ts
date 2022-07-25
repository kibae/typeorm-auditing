import { AfterLoad, BaseEntity, Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { AuditingAction, AuditingEntity, IAuditingEntity } from '../../decorator/auditing-entity.decorator';

abstract class MyBase1 extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int' })
    id!: number;
}

abstract class MyBase2 extends MyBase1 {
    @Column()
    @Index()
    firstName!: string;
}

@Entity()
export class Case1 extends MyBase2 {
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

@AuditingEntity(Case1, {
    //Set type to int for sqlite e2e test
    seqType: 'int',
})
export class Case1Audit extends Case1 implements IAuditingEntity {
    readonly _seq!: number;
    readonly _action!: AuditingAction;
    readonly _modifiedAt!: Date;
}
