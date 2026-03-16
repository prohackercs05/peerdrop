@echo off
echo. > env_check.txt
echo Checking Environment... >> env_check.txt

echo 1. Checking Java Runtime >> env_check.txt
java -version 2>> env_check.txt
if %ERRORLEVEL% NEQ 0 (
    echo Java Runtime NOT found >> env_check.txt
) else (
    echo Java Runtime FOUND >> env_check.txt
)

echo. >> env_check.txt
echo 2. Checking Java Compiler >> env_check.txt
javac -version 2>> env_check.txt
if %ERRORLEVEL% NEQ 0 (
    echo Java Compiler NOT found >> env_check.txt
) else (
    echo Java Compiler FOUND >> env_check.txt
)

echo. >> env_check.txt
echo 3. Checking Maven >> env_check.txt
call mvn -version 2>> env_check.txt
if %ERRORLEVEL% NEQ 0 (
    echo Maven NOT found >> env_check.txt
) else (
    echo Maven FOUND >> env_check.txt
)
