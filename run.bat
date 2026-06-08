@echo off
set MAVEN_HOME=D:\maven\apache-maven-3.9.16-bin\apache-maven-3.9.16
set PATH=%MAVEN_HOME%\bin;%PATH%
cd /d "%~dp0"
mvn spring-boot:run
