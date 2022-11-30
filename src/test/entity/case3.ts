import { BeforeInsert, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AuditingAction, AuditingEntity, AuditingEntityDefaultColumns } from '../../decorator/auditing-entity.decorator';

@Entity()
export class Case3Parent {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;
}

export class Case3Base {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne('Case3Parent', 'id')
    @JoinColumn({ name: 'parent_id' })
    parent!: Case3Parent;
}

@Entity()
export class Case3 extends Case3Base {
    @Column({ name: 'first_name' })
    @Index({ unique: true })
    firstName!: string;

    @Column()
    lastName!: string;

    @Column()
    age!: number;
}

@AuditingEntity(Case3, {
    //Set type to int for sqlite e2e test
    seqType: 'int',
})
export class Case3Audit extends Case3 implements AuditingEntityDefaultColumns {
    readonly _seq!: number;
    readonly _action!: AuditingAction;
    readonly _modifiedAt!: Date;

    // id!: number;
    // parent!: Case3Parent;
    // firstName!: string;
    // lastName!: string;
    // age!: number;

    @Column({ nullable: true })
    additionalColumn!: string;

    @Column({ nullable: true, type: 'varchar', length: 100 })
    _modifiedBy!: string;

    @BeforeInsert()
    storeModifiedBy() {
        this._modifiedBy = `${this.firstName} ${this.lastName}`;
    }
}
