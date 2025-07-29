echo "¡Despliegue completado!"

@echo off
REM Script para build y despliegue local a gh-pages
REM Ejecutar desde la rama developer

REM 1. Build en developer
set GH_PAGES=true
npm run build

REM 2. Cambiar a gh-pages
git checkout gh-pages

REM 3. Limpiar archivos antiguos en gh-pages (excepto .git y .nojekyll)
for /f %%f in ('dir /b /a-d') do if not "%%f"==".nojekyll" if not "%%f"==".git" del "%%f"
for /d %%d in (*) do if not "%%d"==".git" rmdir /s /q "%%d"

REM 4. Copiar archivos de out a la raíz de gh-pages
robocopy out . /E

REM 5. Eliminar archivos innecesarios (ejemplo: .gitignore)
if exist .gitignore del .gitignore

REM 6. Listo para revisión manual y push
echo "Archivos copiados a gh-pages. Revisa y haz el push manual si todo está correcto."
