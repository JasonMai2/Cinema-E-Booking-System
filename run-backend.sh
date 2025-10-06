#!/usr/bin/env bash
cd backend
chmod +x mvnw
nohup ./mvnw -DskipTests -Dspring-boot.run.profiles=dev spring-boot:run > ../backend-run.log 2>&1 &
echo "Backend started; logs -> ../backend-run.log (PID $!)"
tail -n 50 ../backend-run.log
