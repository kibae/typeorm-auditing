import { AfterLoad, BaseEntity, BeforeInsert, Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AuditingAction, AuditingEntity, AuditingEntityDefaultColumns } from '../../decorator/auditing-entity.decorator';

abstract class MyBase1 {
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

    @OneToMany(() => ChildCase2, (child) => child.id)
    children!: ChildCase2[];

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

@Entity()
export class ChildCase2 {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @ManyToOne((type) => Case2, (parent) => parent.children)
    case2!: Case2;
}

@AuditingEntity(Case2, {
    //Set type to int for sqlite e2e test
    seqType: 'int',
})
export class Case2Audit extends BaseEntity implements AuditingEntityDefaultColumns {
    readonly _seq!: number;
    readonly _action!: AuditingAction;
    readonly _modifiedAt!: Date;

    @Column({ nullable: true })
    additionalColumn!: string;

    @Column({ nullable: true, type: 'varchar', length: 100 })
    _modifiedBy!: string;

    id!: number;
    firstName!: string;
    lastName!: string;

    @BeforeInsert()
    storeModifiedBy() {
        this._modifiedBy = `${this.firstName} ${this.lastName}`;
    }
}
