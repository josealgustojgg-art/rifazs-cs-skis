@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Instale o Node.js 24 LTS em https://nodejs.org e abra este arquivo novamente.
 pause
 exit /b 1
)
node -e "if(Number(process.versions.node.split('.')[0])<22)process.exit(1)"
if errorlevel 1 (
 echo Atualize o Node.js para a versao 24 LTS em https://nodejs.org
 pause
 exit /b 1
)
if not exist node_modules\tiktok-live-connector\package.json (
 echo Preparando as dependencias. E necessario acesso a internet nesta etapa.
 call npm ci --omit=dev --cache "%TEMP%\planalto-npm-cache" --no-audit --no-fund
 if errorlevel 1 (
  echo A instalacao falhou. Confira sua conexao e tente novamente.
  pause
  exit /b 1
 )
)
node server/index.js --open
pause
