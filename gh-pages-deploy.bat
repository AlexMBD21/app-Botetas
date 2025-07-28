@echo off
REM Script para publicar en gh-pages
REM Requiere tener instalado gh (GitHub CLI)

REM Salir si hay errores
setlocal enabledelayedexpansion

REM Build y exportar
npm run build && npm run export

REM Ir a carpeta out
cd out

REM Inicializar repo y subir a gh-pages
REM Configura tu usuario y repo si es necesario
REM Elimina el historial anterior
if exist .git rmdir /s /q .git

git init

git checkout -b gh-pages

git add .
git commit -m "Deploy to gh-pages"

git remote add origin https://github.com/AlexMBD21/app-Botetas.git

git push -f origin gh-pages

cd ..

echo "¡Despliegue completado!"
