# TypeORM Auditing(Decorator)
- Entity의 변화(Create, Update, Delete)를 자동으로 구성된 히스토리 테이블에 적재합니다.

[![Node.js CI](https://github.com/kibae/typeorm-auditing/actions/workflows/node.js.yml/badge.svg)](https://github.com/kibae/typeorm-auditing/actions/workflows/node.js.yml)
[![NPM Version](https://badge.fury.io/js/typeorm-auditing.svg)](https://www.npmjs.com/package/typeorm-auditing)
[![License](https://img.shields.io/github/license/kibae/typeorm-auditing)](https://github.com/kibae/typeorm-auditing/blob/main/LICENSE)

## Install
- NPM
```shell
$ npm install typeorm-auditing --save
```

- Yarn
```shell
$ yarn add typeorm-auditing
```

----

## Usage
### 0. Origin entity *(기존 코드를 바꿀 필요가 없습니다)*
- 기존의 entity 정의를 그대로 활용할 수 있습니다.
```typescript
export abstract class MyBase extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;
}

@Entity()
// @Entity({ ...yourEntityOption, database: 'my-database', schema: 'my-schema' })
export class User extends MyBase {
    @Column()
    firstName: string;
    @Column()
    lastName: string;
    @Column()
    age: number;

    public get fullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }
}
```

### 1. Auditing Entity
- 일반적인 entity를 정의하듯이 히스토리가 적재될 테이블을 정의할 수 있습니다.
  - 이 예제는 편의를 위해 origin entity를 상속했습니다. Origin을 상속하지 않고 별도(TypeORM.ObjectLiteral)로 entity를 구성해도 됩니다.
  - @Entity decorator 대신 **@AuditingEntity(*TargetEntity*)** decorator를 사용합니다.
  - 자동으로 **_seq**, **_action(*Create, Update, Delete*)**, **_modifiedAt** 컬럼을 추가됩니다. public getter를 정의하여 원하는 이름으로 활용할 수 있습니다.  
```typescript
import { AuditingAction, AuditingEntity, AuditingEntityDefaultColumns } from 'typeorm-auditing'; 

@AuditingEntity(User)
// @AuditingEntity(User, { ...overrideUserEntitiesEntityOption, database: 'my-database', schema: 'my-schema' })
export class AuditingUser extends User implements AuditingEntityDefaultColumns {
    readonly _seq: number;
    readonly _action: AuditingAction;
    readonly _modifiedAt: Date;

    // 일반적인 entity처럼 컬럼을 추가하고 인덱스도 설정할 수 있습니다. 일반적으로는 TypeORM event를 통해 자동으로 레코드가 생성되기 때문에 nullable이거나 @BeforeInsert를 활용하여 내용을 채워줘야 합니다.
    // @Column({ nullable: true })
    // additionalColumn!: string;
}
```

### 2. Subscribe TypeORM event
- TypeORM DataSource마다 subscribers를 설정해야 합니다. 하나의 DataSource에 한 번만 설정하면 되지만, 여러 DataSource가 정의된다면 각각 설정해 주세요.
```typescript
import { AuditingSubscriber } from 'typeorm-auditing';

const dataSource = new DataSource({
    ...yourDataSourceConfig,
    entities: [User, AuditingUser],
    //entities: ['path-of-your-entities-path'],
    subscribers: [AuditingSubscriber],
})
```

----

## Contributors
<a href="https://github.com/kibae/typeorm-auditing/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=kibae/typeorm-auditing" />
</a>

----

## Example

### [Sample Code](https://github.com/kibae/typeorm-auditing/blob/main/src/test/auditing-entity.decorator.example.ts)
```typescript
import { DataSource } from 'typeorm';
import { Case1, Case1Audit } from './entity/case1';
import { AuditingSubscriber } from 'typeorm-auditing';

(async function () {
    //Data Source
    const dataSource = await new DataSource({
        type: 'sqlite',
        database: ':memory:',
        synchronize: true,
        logging: 'all',
        entities: [Case1, Case1Audit],
        subscribers: [AuditingSubscriber],
    }).initialize();

    //Create
    const entity = await dataSource.manager.save(
        Case1.create({
            firstName: 'Timber',
            lastName: 'Saw',
            age: 25,
        })
    );

    //Update
    entity.age++;
    await entity.save();

    //Delete
    await entity.remove();

    //!!!! Print history entities
    console.log(await dataSource.manager.find(Case1Audit));
})();
```

### [Sample Entity](https://github.com/kibae/typeorm-auditing/blob/main/src/test/entity/case1.ts)
- Origin Entity
```typescript
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Case1 extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int' })
    id!: number;

    @Column()
    firstName!: string;

    @Column()
    lastName!: string;

    @Column()
    age!: number;
}
```

- Audit Entity
```typescript
import { AuditingAction, AuditingEntity, AuditingEntityDefaultColumns } from 'typeorm-auditing';

@AuditingEntity(Case1)
export class Case1Audit extends Case1 implements AuditingEntityDefaultColumns {
    readonly _seq!: number;
    readonly _action!: AuditingAction;
    readonly _modifiedAt!: Date;
}
```

### Result

```shell
$ npx ts-node src/test/auditing-entity.decorator.example.ts 
creating a new table: case1
query: CREATE TABLE "case1" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "firstName" varchar NOT NULL, "lastName" varchar NOT NULL, "age" integer NOT NULL)
query: CREATE TABLE "case1_audit" ("_seq" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "_action" varchar(20) NOT NULL, "_modifiedAt" datetime NOT NULL DEFAULT (datetime('now')), "id" integer, "firstName" varchar, "lastName" varchar, "age" integer)
query: CREATE INDEX "IDX_d2fc2ad0a4f22955513bca9b1d" ON "case1_audit" ("id") 
query: COMMIT

query: BEGIN TRANSACTION
query: INSERT INTO "case1"("id", "firstName", "lastName", "age") VALUES (NULL, ?, ?, 25) -- PARAMETERS: ["Timber","Saw"]
query: INSERT INTO "case1_audit"("_seq", "_action", "_modifiedAt", "id", "firstName", "lastName", "age") VALUES (NULL, ?, datetime('now'), 1, ?, ?, 25) -- PARAMETERS: ["Create","Timber","Saw"]
query: SELECT "Case1Audit"."_seq" AS "Case1Audit__seq", "Case1Audit"."_modifiedAt" AS "Case1Audit__modifiedAt" FROM "case1_audit" "Case1Audit" WHERE "Case1Audit"."_seq" = 1
query: COMMIT
query: SELECT "Case1"."id" AS "Case1_id", "Case1"."firstName" AS "Case1_firstName", "Case1"."lastName" AS "Case1_lastName", "Case1"."age" AS "Case1_age" FROM "case1" "Case1" WHERE "Case1"."id" IN (1)

query: BEGIN TRANSACTION
query: UPDATE "case1" SET "age" = 26 WHERE "id" IN (1)
query: INSERT INTO "case1_audit"("_seq", "_action", "_modifiedAt", "id", "firstName", "lastName", "age") VALUES (NULL, ?, datetime('now'), 1, ?, ?, 26) -- PARAMETERS: ["Update","Timber","Saw"]
query: SELECT "Case1Audit"."_seq" AS "Case1Audit__seq", "Case1Audit"."_modifiedAt" AS "Case1Audit__modifiedAt" FROM "case1_audit" "Case1Audit" WHERE "Case1Audit"."_seq" = 2
query: COMMIT
query: SELECT "Case1"."id" AS "Case1_id", "Case1"."firstName" AS "Case1_firstName", "Case1"."lastName" AS "Case1_lastName", "Case1"."age" AS "Case1_age" FROM "case1" "Case1" WHERE "Case1"."id" IN (1)

query: BEGIN TRANSACTION
query: DELETE FROM "case1" WHERE "id" = 1
query: INSERT INTO "case1_audit"("_seq", "_action", "_modifiedAt", "id", "firstName", "lastName", "age") VALUES (NULL, ?, datetime('now'), 1, ?, ?, 26) -- PARAMETERS: ["Delete","Timber","Saw"]
query: SELECT "Case1Audit"."_seq" AS "Case1Audit__seq", "Case1Audit"."_modifiedAt" AS "Case1Audit__modifiedAt" FROM "case1_audit" "Case1Audit" WHERE "Case1Audit"."_seq" = 3
query: COMMIT

query: SELECT "Case1Audit"."_seq" AS "Case1Audit__seq", "Case1Audit"."_action" AS "Case1Audit__action", "Case1Audit"."_modifiedAt" AS "Case1Audit__modifiedAt", "Case1Audit"."id" AS "Case1Audit_id", "Case1Audit"."firstName" AS "Case1Audit_firstName", "Case1Audit"."lastName" AS "Case1Audit_lastName", "Case1Audit"."age" AS "Case1Audit_age" FROM "case1_audit" "Case1Audit"
[
  Case1Audit {
    _seq: 1,
    _action: 'Create',
    _modifiedAt: 2022-07-21T19:18:42.000Z,
    id: 1,
    firstName: 'Timber',
    lastName: 'Saw',
    age: 25
  },
  Case1Audit {
    _seq: 2,
    _action: 'Update',
    _modifiedAt: 2022-07-21T19:18:42.000Z,
    id: 1,
    firstName: 'Timber',
    lastName: 'Saw',
    age: 26
  },
  Case1Audit {
    _seq: 3,
    _action: 'Delete',
    _modifiedAt: 2022-07-21T19:18:42.000Z,
    id: 1,
    firstName: 'Timber',
    lastName: 'Saw',
    age: 26
  }
]

```