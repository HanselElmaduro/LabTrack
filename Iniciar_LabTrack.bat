@echo off
setlocal
pushd "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Instala Node.js 24 o posterior para ejecutar LabTrack.
  echo Consulta README.md.
  pause
  exit /b 1
)
node -e "if(Number(process.versions.node.split('.')[0])<24)process.exit(1)"
if errorlevel 1 (
  echo Esta version de LabTrack requiere Node.js 24 o posterior.
  pause
  exit /b 1
)
echo Iniciando LabTrack. Deja esta ventana abierta durante la demostracion.
echo Abre http://localhost:3000 en tu navegador.
node 01_Sistema/server/index.js
popd
pause
