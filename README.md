# Cinema-E-Booking-System
A web-based application that allows users to access information about available movies and to book tickets and select seats online.  Users must be able to pay for their tickets online, and upon payment users can save and use their tickets. 

1) git clone <repo-url>
cd <repo>
cp .env.example .env      # ensure .env is in .gitignore

2) docker compose up -d mysql adminer
# watch logs if you want:
docker compose logs -f mysql

3) # optional loop: wait until mysql is healthy (approx)
until docker exec cinemae-mysql mysqladmin ping -uroot -p"${MYSQL_ROOT_PASSWORD}" --silent; do
  echo "waiting for mysql..."
  sleep 1
done
echo "mysql ready"

4) start backend
chmod +x mvnw
./mvnw -DskipTests -Dspring-boot.run.profiles=dev spring-boot:run

5) *Do it manually*
# from repo root (where ecinema.sql lives)
# disable FK checks wrapper recommended
( echo 'SET FOREIGN_KEY_CHECKS=0;'; cat ecinema.sql; echo 'SET FOREIGN_KEY_CHECKS=1;' ) \
  | docker exec -i cinemae-mysql mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" "${MYSQL_DATABASE}"

6) # set datasource envs for local host mapping (if needed)
export SPRING_DATASOURCE_URL="jdbc:mysql://localhost:${MYSQL_HOST_PORT:-3307}/${MYSQL_DATABASE}?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
export SPRING_DATASOURCE_USERNAME="${MYSQL_USER:-cinemae}"
export SPRING_DATASOURCE_PASSWORD="${MYSQL_PASSWORD:-devsecret}"

cd backend
chmod +x mvnw
./mvnw -DskipTests -Dspring-boot.run.profiles=dev spring-boot:run
# (If using Flyway, migrations will run automatically at startup)

7) cd frontend
export REACT_APP_API_URL=http://localhost:8080
npm install
npm start
# open http://localhost:3000

8) curl http://localhost:8080/db/ping
# MySQL check:
docker exec -it cinemae-mysql mysql -ucinemae -pdevsecret -e "USE ecinema; SELECT COUNT(*) FROM users;"
# Adminer at http://localhost:8083  (user: root/rootpw OR cinemae/devsecret)

9) What to add to your repo
## Local DB (Docker) — quickstart

        1. Copy env:
        cp .env.example .env

        2. Start DB + adminer:
        docker compose up -d mysql adminer

        3. If you use Flyway (recommended), start backend and migrations will apply automatically:
        export SPRING_DATASOURCE_URL="jdbc://... (see .env)"
        cd backend
        ./mvnw -DskipTests -Dspring-boot.run.profiles=dev spring-boot:run

        4. If not using Flyway, import schema:
        ( echo 'SET FOREIGN_KEY_CHECKS=0;'; cat ecinema.sql; echo 'SET FOREIGN_KEY_CHECKS=1;' ) \
            | docker exec -i cinemae-mysql mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" "${MYSQL_DATABASE}"

        5. Optional seed:
        docker exec -i cinemae-mysql mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" "${MYSQL_DATABASE}" < data/seed_demo.sql

        6. Adminer UI:
        http://localhost:8083
