import {
    AfterLoad,
    BaseEntity,
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { AuditingAction, AuditingEntity, AuditingEntityDefaultColumns } from '../../decorator/auditing-entity.decorator';

abstract class MyBase1 extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int' })
    id!: number;
}

abstract class MyBase2 extends MyBase1 {
    @Column()
    @Index()
    firstName!: string;
}

enum Gender {
    Male = 'Male',
    Female = 'Female',
    Diverse = 'Diverse',
}

@Entity()
export class Case1 extends MyBase2 {
    @Column()
    lastName!: string;

    @Column()
    age!: number;

    @Column({
        type: 'enum',
        enum: Gender,
        enumName: 'Gender', // Had to add this, otherwise it cant even generate the migration
    })
    gender!: Gender;

    @Column({ default: true })
    status!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt!: Date;

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
export class Case1Audit extends Case1 implements AuditingEntityDefaultColumns {
    readonly _seq!: number;
    readonly _action!: AuditingAction;
    readonly _modifiedAt!: Date;
}
