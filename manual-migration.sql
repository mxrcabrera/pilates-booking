-- Manual Migration Script
-- This script renames profesores table to users and prepares for new schema

-- Step 1: Drop all foreign key constraints that reference profesores
ALTER TABLE "horarios_disponibles" DROP CONSTRAINT IF EXISTS "horarios_disponibles_profesor_id_fkey";
ALTER TABLE "clases" DROP CONSTRAINT IF EXISTS "clases_profesor_id_fkey";
ALTER TABLE "packs" DROP CONSTRAINT IF EXISTS "packs_profesor_id_fkey";
ALTER TABLE "alumnos" DROP CONSTRAINT IF EXISTS "alumnos_profesor_id_fkey";
ALTER TABLE "accounts" DROP CONSTRAINT IF EXISTS "accounts_user_id_fkey";
ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "sessions_user_id_fkey";

-- Step 2: Rename the table
ALTER TABLE "profesores" RENAME TO "users";

-- Step 3: Add the new role column with default value
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'PROFESOR';

-- Step 4: Create the UserRole enum type
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('PROFESOR', 'ALUMNO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 5: Change role column to use enum
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole" USING "role"::text::"UserRole";

-- Step 6: Recreate foreign key constraints with new table name
ALTER TABLE "horarios_disponibles" ADD CONSTRAINT "horarios_disponibles_profesor_id_fkey"
    FOREIGN KEY ("profesor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "clases" ADD CONSTRAINT "clases_profesor_id_fkey"
    FOREIGN KEY ("profesor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "packs" ADD CONSTRAINT "packs_profesor_id_fkey"
    FOREIGN KEY ("profesor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "alumnos" ADD CONSTRAINT "alumnos_profesor_id_fkey"
    FOREIGN KEY ("profesor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 7: Create NotificationType enum
DO $$ BEGIN
    CREATE TYPE "NotificationType" AS ENUM ('RESERVA_NUEVA', 'RESERVA_CANCELADA', 'CLASE_MODIFICADA', 'CLASE_CANCELADA', 'RECORDATORIO_CLASE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 8: Create reservas table
CREATE TABLE IF NOT EXISTS "reservas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alumno_user_id" TEXT NOT NULL,
    "profesor_id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fin" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'confirmada',
    "notas_alumno" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelada_en" TIMESTAMP(3),

    CONSTRAINT "reservas_alumno_user_id_fkey" FOREIGN KEY ("alumno_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reservas_profesor_id_fkey" FOREIGN KEY ("profesor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Step 9: Create notificaciones table
CREATE TABLE IF NOT EXISTS "notificaciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "tipo" "NotificationType" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "reserva_id" TEXT,
    "email_enviado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "notificaciones_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Done! Now you can run: npx prisma db pull && npx prisma generate
