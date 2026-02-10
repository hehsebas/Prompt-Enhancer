# Script para despliegue manual rápido a Hostinger
# Uso: .\deploy-manual.ps1

Write-Host "🚀 Iniciando despliegue manual..." -ForegroundColor Cyan

# 1. Configurar variables de entorno
Write-Host "⚙️ Configurando variables de entorno..." -ForegroundColor Yellow
$env:VITE_APP_URL = "https://greenyellow-oryx-635013.hostingersite.com"

# 2. Ir a la carpeta frontend
Set-Location frontend

# 3. Build del proyecto
Write-Host "📦 Compilando proyecto..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al compilar el proyecto" -ForegroundColor Red
    exit 1
}

# 4. Volver a la raíz
Set-Location ..

# 5. Copiar icon.svg
Write-Host "📁 Copiando archivos adicionales..." -ForegroundColor Yellow
Copy-Item .\icon.svg .\frontend\dist\icon.svg -Force

# 6. Crear .htaccess
$htaccessContent = @"
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
"@

$htaccessContent | Out-File -FilePath .\frontend\dist\.htaccess -Encoding utf8 -Force

Write-Host "✅ Build completado!" -ForegroundColor Green
Write-Host ""
Write-Host "📤 Ahora sube el contenido de 'frontend\dist\' a 'public_html' en Hostinger" -ForegroundColor Cyan
Write-Host ""
Write-Host "Archivos a subir:" -ForegroundColor Yellow
Get-ChildItem .\frontend\dist\ -Recurse -Name

Write-Host ""
Write-Host "💡 Tip: Puedes usar FileZilla para subir los archivos más rápido" -ForegroundColor Magenta
Write-Host "Servidor FTP: Obtén desde Hostinger > FTP Accounts" -ForegroundColor Gray

# Preguntar si quiere abrir la carpeta dist
$openFolder = Read-Host "¿Abrir carpeta dist? (s/n)"
if ($openFolder -eq "s" -or $openFolder -eq "S") {
    Invoke-Item .\frontend\dist\
}
