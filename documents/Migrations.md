# Database Migrations Guide

This guide covers how to work with TypeORM migrations in the Code Rank project.

## Prerequisites

- PostgreSQL database running locally or remotely
- Environment variables configured in `.env` file:
  ```
  DB_HOST=localhost
  DB_PORT=5432
  DB_USERNAME=coderank
  DB_PASSWORD=coderank
  DB_NAME=coderank
  ```

## Setup

### 1. TypeORM DataSource Configuration

The migration system uses `core-api/typeorm.datasource.ts` to connect to the database:

```typescript
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({
    path: path.resolve(process.cwd(), '.env'),
});

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: ['core-api/src/**/*.entity.ts'],
    migrations: ['core-api/src/migrations/*.ts'],
    synchronize: false,
});
```

### 2. Entity Setup

Ensure your entities have `reflect-metadata` imported:

```typescript
import 'reflect-metadata';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('table_name')
export class YourEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  
  @Column()
  name!: string;
}
```

## Available Commands

### Generate a Migration

Generate a new migration based on entity changes:

```bash
npm run migration:generate -- --name=MigrationNameHere
```

**Example:**
```bash
npm run migration:generate -- --name=CreateUsersTable
```

This will:
- Compare your entities with the current database schema
- Generate a new migration file in `core-api/src/migrations/`
- Create `up()` and `down()` methods automatically

### Run Migrations

Apply pending migrations to the database:

```bash
npm run migration:run
```

This will execute all migration files that haven't been run yet.

### Revert Migrations

Revert the last executed migration:

```bash
npm run migration:revert
```

**Note:** This only reverts one migration at a time. Repeat the command to revert additional migrations.

## Migration Workflow

### Creating a New Feature with Database Changes

1. **Create/Update Entity**
   ```bash
   # Create your entity in core-api/src/app/feature/entities/
   ```

2. **Generate Migration**
   ```bash
   npm run migration:generate -- --name=FeatureNameChange
   ```

3. **Review Generated Migration**
   - Check `core-api/src/migrations/` for the new migration file
   - Verify the `up()` and `down()` methods

4. **Run Migration**
   ```bash
   npm run migration:run
   ```

5. **Commit to Git**
   ```bash
   git add core-api/src/migrations/
   git commit -m "Add migration: FeatureNameChange"
   ```

### Reverting Changes

If you need to undo migrations during development:

```bash
# Revert last migration
npm run migration:revert

# Revert multiple times (repeat as needed)
npm run migration:revert
npm run migration:revert
```

## Troubleshooting

### Error: "Unable to resolve signature of property decorator"

**Solution:** Ensure `reflect-metadata` is imported at the top of:
- Your entity file
- `typeorm.datasource.ts`

### Error: "Database connection failed"

**Solution:** Verify environment variables:
```bash
# Check .env file has correct values
cat .env | grep DB_
```

### Error: "client password must be a string"

**Solution:** Ensure `DB_PASSWORD` is set and not empty in `.env`

### No migrations found to run

**Solution:** 
- Check that migration files exist in `core-api/src/migrations/`
- Verify migrations table exists in database:
  ```sql
  SELECT * FROM migrations;
  ```

## Current Migrations

- `1768570119623-userInit.ts` - Creates users table with user_name, email, password_hash, is_active, rate_limit_tier, created_at, updated_at columns

## Best Practices

1. **Always generate migrations** - Don't manually edit schema
2. **Test locally first** - Run migrations in development before production
3. **Review before committing** - Check generated migrations for accuracy
4. **Keep migrations small** - One feature per migration when possible
5. **Never modify old migrations** - Create new ones instead
6. **Document complex migrations** - Add comments explaining the purpose


## Duplicate Migration Files Issue

### Problem
If you accidentally generated the same migration twice, you'll have multiple migration files with similar names:
- `1768570095799-userInit.ts`
- `1768570119623-userInit.ts`

This causes: `relation "users" already exists` error

### Solution

1. **Identify duplicate migrations**
   ```bash
   ls -la core-api/src/migrations/
   ```

2. **Delete the older migration file**
   ```bash
   rm core-api/src/migrations/1768570095799-userInit.ts
   ```
   Keep only the most recent one.

3. **Check migration status**
   ```bash
   npm run typeorm -- migration:show -d core-api/typeorm.datasource.ts
   ```

4. **Run migrations**
   ```bash
   npm run migration:run
   ```

### Prevention Tips
- Always check existing migrations before generating new ones
- Use descriptive migration names: `CreateUsersTable`, `AddEmailColumn`, etc.
- Review the migrations folder before committing