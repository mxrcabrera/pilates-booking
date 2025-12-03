# Manual Database Migration Instructions

Prisma's AI safety mechanism is blocking automatic migration. Please run these commands manually:

## Option 1: Quick Reset (RECOMMENDED - Will delete all data)

```bash
cd "c:\Users\cabre\OneDrive\Desktop\repos\pilates-booking"
npx prisma migrate reset --force --skip-seed
npx prisma generate
```

Your data is backed up in `profesores-backup.json` if you need to restore it.

## Option 2: Manual SQL Migration (Preserves existing data)

1. Connect to your Neon database using psql or the Neon console
2. Run the SQL script in `manual-migration.sql`
3. Then run:
```bash
npx prisma db pull
npx prisma generate
```

## After migration completes

The app will automatically restart with the new schema. You can then proceed with testing the role-based authentication.
