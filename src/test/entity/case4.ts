import { BeforeInsert, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AuditingAction, AuditingEntity, AuditingEntityDefaultColumns } from '../../decorator/auditing-entity.decorator';

@Entity()
export class Case4Parent {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;
}

export class Case4Base {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Case4Parent, (o) => o.id)
    @JoinColumn({ name: 'parent_id' })
    parent!: Case4Parent;
}

@Entity()
export class Case4 extends Case4Base {
    @Column({ name: 'first_name' })
    @Index({ unique: true })
    firstName!: string;

    @Column()
    lastName!: string;

    @Column()
    age!: number;

    @Column({ default: true })
    status!: boolean;
}

@AuditingEntity(Case4, {
    //Set type to int for sqlite e2e test
    seqType: 'int',
})
export class Case4Audit implements AuditingEntityDefaultColumns {
    readonly _seq!: number;
    readonly _action!: AuditingAction;
    readonly _modifiedAt!: Date;

    id!: number;
    parent!: Case4Parent;
    firstName!: string;
    lastName!: string;
    age!: number;
    status!: boolean;

    @Column({ nullable: true })
    additionalColumn!: string;

    @Column({ nullable: true, type: 'varchar', length: 100 })
    _modifiedBy!: string;

    @BeforeInsert()
    storeModifiedBy() {
        this._modifiedBy = `${this.firstName} ${this.lastName}`;
    }
}
