@echo off
echo ========================================
echo   DESPLIEGUE MANUAL A HOSTINGER
echo ========================================
echo.

echo [1/4] Configurando variables de entorno...
set VITE_APP_URL=https://greenyellow-oryx-635013.hostingersite.com

echo [2/4] Compilando proyecto...
cd frontend
call npm run build

if errorlevel 1 (
    echo ERROR: No se pudo compilar el proyecto
    pause
    exit /b 1
)

cd ..

echo [3/4] Copiando icon.svg...
copy icon.svg frontend\dist\icon.svg /Y

echo [4/4] Creando .htaccess...
(
echo ^<IfModule mod_rewrite.c^>
echo   RewriteEngine On
echo   RewriteBase /
echo   RewriteRule ^^index\.html$ - [L]
echo   RewriteCond %%{REQUEST_FILENAME} !-f
echo   RewriteCond %%{REQUEST_FILENAME} !-d
echo   RewriteCond %%{REQUEST_FILENAME} !-l
echo   RewriteRule . /index.html [L]
echo ^</IfModule^>
) > frontend\dist\.htaccess

echo.
echo [5/5] Build completado!
echo.
echo ========================================
echo   SIGUIENTE PASO:
echo ========================================
echo Sube el contenido de 'frontend\dist\' 
echo a 'public_html' en Hostinger
echo.
echo Archivos generados:
dir frontend\dist /b

echo.
echo Presiona cualquier tecla para abrir la carpeta dist...
pause > nul
explorer frontend\dist
