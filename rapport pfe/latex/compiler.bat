@echo off
REM =====================================================================
REM  Compilation du rapport PFE
REM =====================================================================
REM  pdflatex est lance DEUX fois : la premiere passe collecte la table
REM  des matieres, la table des figures, la liste des tableaux, les
REM  references croisees et le nombre total de pages ; la seconde les
REM  place. Aucune autre commande n'est necessaire : la bibliographie
REM  est tenue a la main, il n'y a ni biber ni makeglossaries.
REM =====================================================================
setlocal

where pdflatex >nul 2>&1
if errorlevel 1 (
  echo.
  echo   pdflatex est introuvable.
  echo   Installez MiKTeX ^(https://miktex.org^) ou TeX Live, puis
  echo   relancez ce script.
  echo.
  exit /b 1
)

echo [1/3] Controle statique du projet...
python verifier.py
if errorlevel 1 echo   ^(controle ignore : Python indisponible^)

echo.
echo [2/3] Premiere passe...
pdflatex -interaction=nonstopmode -halt-on-error main.tex >nul
if errorlevel 1 goto erreur

echo [3/3] Seconde passe...
pdflatex -interaction=nonstopmode -halt-on-error main.tex >nul
if errorlevel 1 goto erreur

echo.
echo   main.pdf genere.
echo.
findstr /C:"LaTeX Warning: Reference" main.log >nul && (
  echo   Attention : des references restent non resolues.
  echo   Relancez le script une troisieme fois.
)
exit /b 0

:erreur
echo.
echo   La compilation a echoue. Les erreurs sont dans main.log :
echo.
findstr /B /C:"!" main.log
echo.
exit /b 1
