# TypeORM Auditing(Decorator)
- Create history tables and manage changes of entity automatically

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
### 0. Origin entity *(You don't need to change your existing code)*
- This is a general entity definition. You don't need to change your existing code to add auditing feature.
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
- Define an history entity to store the changes of User entities.
  - *In order to easily define columns, extended the User entity.*
- **@AuditingEntity(*TargetEntity*)** decorator automatically creates a table with **_seq**, **_action(*Create, Update, Delete*)** and **_modifiedAt** columns.
```typescript
import { AuditingAction, AuditingEntity, IAuditingEntity } from 'typeorm-auditing'; 

@AuditingEntity(User)
// @AuditingEntity(User, { ...overrideUserEntitiesEntityOption, database: 'my-database', schema: 'my-schema' })
export class AuditingUser extends User implements IAuditingEntity {
    readonly _seq: number;
    readonly _action: AuditingAction;
    readonly _modifiedAt: Date;
}
```

### 2. Subscribe TypeORM event
- You only need to configure it once for multiple entities.
- However, if there are multiple data sources, you need to set them up for each data source.
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
