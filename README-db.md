# Cinema E-Booking — Local Dev Quickstart

Prereqs: Docker, Java (17+), Maven, Node (for frontend dev)

1) Start DB:
   docker compose up -d

2) Import schema (if needed):
   ( echo 'SET FOREIGN_KEY_CHECKS=0;'; cat ecinema.sql; echo 'SET FOREIGN_KEY_CHECKS=1;' ) \
     | docker exec -i cinemae-mysql mysql -uroot -prootpw -D ecinema

3) Start backend:
   cd backend
   ./mvnw -DskipTests -Dspring-boot.run.profiles=dev spring-boot:run

   Health: http://localhost:8080/db/ping

4) Start frontend (dev):
   cd frontend
   npm install
   npm start

5) Serve production build:
   cd frontend
   REACT_APP_API_URL=http://localhost:8080 npm run build
   npx serve -s build

6) Stop everything:
   docker compose down -v
