@echo off
cd /d "%~dp0"
echo Reseteando la base de datos...
echo.
npx prisma migrate reset --force --skip-seed
echo.
echo Generando cliente de Prisma...
npx prisma generate
echo.
echo Listo! La base de datos ha sido reseteada.
pause
