How to Configure Database
1. Start MySQL locally.
2. Create the database:
  CREATE DATABASE cinema_db;
3. Create a .env file in the backend/ folder
  DB_USER=your_mysql_username
  DB_PASSWORD=your_mysql_password

How to Build and Run Project Backend
1. mvn clean install
2. mvn spring-boot:run