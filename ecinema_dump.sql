-- MySQL dump 10.13  Distrib 8.0.36, for Linux (aarch64)
--
-- Host: localhost    Database: ecinema
-- ------------------------------------------------------
-- Server version	8.0.36

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `auditoriums`
--

DROP TABLE IF EXISTS `auditoriums`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auditoriums` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `seat_rows` int unsigned DEFAULT NULL,
  `seat_cols` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditoriums`
--

LOCK TABLES `auditoriums` WRITE;
/*!40000 ALTER TABLE `auditoriums` DISABLE KEYS */;
INSERT INTO `auditoriums` VALUES (1,'Aud 2',8,10);
/*!40000 ALTER TABLE `auditoriums` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `booking_number` char(14) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `status` enum('PENDING','PAID','CANCELLED','EXPIRED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `subtotal_cents` int unsigned NOT NULL DEFAULT '0',
  `fees_cents` int unsigned NOT NULL DEFAULT '0',
  `tax_cents` int unsigned NOT NULL DEFAULT '0',
  `total_cents` int unsigned NOT NULL DEFAULT '0',
  `promo_code_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `booking_number` (`booking_number`),
  KEY `idx_bookings_user_created` (`user_id`,`created_at`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` smallint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `media_assets`
--

DROP TABLE IF EXISTS `media_assets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `media_assets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `movie_id` bigint unsigned NOT NULL,
  `kind` enum('POSTER','STILL','TRAILER_IMAGE','TRAILER_VIDEO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `movie_id` (`movie_id`),
  CONSTRAINT `media_assets_ibfk_1` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `media_assets`
--

LOCK TABLES `media_assets` WRITE;
/*!40000 ALTER TABLE `media_assets` DISABLE KEYS */;
/*!40000 ALTER TABLE `media_assets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movie_categories`
--

DROP TABLE IF EXISTS `movie_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movie_categories` (
  `movie_id` bigint unsigned NOT NULL,
  `category_id` smallint unsigned NOT NULL,
  PRIMARY KEY (`movie_id`,`category_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `movie_categories_ibfk_1` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `movie_categories_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movie_categories`
--

LOCK TABLES `movie_categories` WRITE;
/*!40000 ALTER TABLE `movie_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `movie_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movie_people`
--

DROP TABLE IF EXISTS `movie_people`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movie_people` (
  `movie_id` bigint unsigned NOT NULL,
  `person_id` bigint unsigned NOT NULL,
  `role` enum('ACTOR','DIRECTOR','PRODUCER') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`movie_id`,`person_id`,`role`),
  KEY `person_id` (`person_id`),
  CONSTRAINT `movie_people_ibfk_1` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `movie_people_ibfk_2` FOREIGN KEY (`person_id`) REFERENCES `people` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movie_people`
--

LOCK TABLES `movie_people` WRITE;
/*!40000 ALTER TABLE `movie_people` DISABLE KEYS */;
/*!40000 ALTER TABLE `movie_people` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movies`
--

DROP TABLE IF EXISTS `movies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movies` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `synopsis` text COLLATE utf8mb4_unicode_ci,
  `mpaa_rating` enum('G','PG','PG-13','R','NC-17') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trailer_video_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trailer_image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FULLTEXT KEY `ft_movies_title_synopsis` (`title`,`synopsis`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movies`
--

LOCK TABLES `movies` WRITE;
/*!40000 ALTER TABLE `movies` DISABLE KEYS */;
INSERT INTO `movies` VALUES (1,'Space Rangers','Action sci-fi','PG-13','','','2025-10-03 23:07:29'),(2,'The Quiet Season','Drama','PG','','','2025-10-03 23:07:29'),(3,'Space Rangers','Action sci-fi','PG-13','','','2025-10-03 23:24:00'),(4,'The Quiet Season','Drama','PG','','','2025-10-03 23:24:00'),(5,'Space Rangers','Action sci-fi','PG-13','','','2025-10-03 23:44:50'),(6,'The Quiet Season','Drama','PG','','','2025-10-03 23:44:50');
/*!40000 ALTER TABLE `movies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `booking_id` bigint unsigned NOT NULL,
  `processor` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `processor_charge_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `brand` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last4` char(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount_cents` int unsigned NOT NULL,
  `currency` char(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USD',
  `success` tinyint(1) NOT NULL,
  `paid_at` datetime DEFAULT NULL,
  `raw_response` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `booking_id` (`booking_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `people`
--

DROP TABLE IF EXISTS `people`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `people` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `full_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `people`
--

LOCK TABLES `people` WRITE;
/*!40000 ALTER TABLE `people` DISABLE KEYS */;
/*!40000 ALTER TABLE `people` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `price_rules`
--

DROP TABLE IF EXISTS `price_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `price_rules` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `scope` enum('GLOBAL','MOVIE','SHOWTIME') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'GLOBAL',
  `movie_id` bigint unsigned DEFAULT NULL,
  `showtime_id` bigint unsigned DEFAULT NULL,
  `child_cents` int unsigned NOT NULL,
  `adult_cents` int unsigned NOT NULL,
  `senior_cents` int unsigned NOT NULL,
  `booking_fee_cents` int unsigned NOT NULL DEFAULT '0',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `effective_from` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `effective_to` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `movie_id` (`movie_id`),
  KEY `showtime_id` (`showtime_id`),
  CONSTRAINT `price_rules_ibfk_1` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `price_rules_ibfk_2` FOREIGN KEY (`showtime_id`) REFERENCES `showtimes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `price_rules`
--

LOCK TABLES `price_rules` WRITE;
/*!40000 ALTER TABLE `price_rules` DISABLE KEYS */;
/*!40000 ALTER TABLE `price_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promotion_codes`
--

DROP TABLE IF EXISTS `promotion_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promotion_codes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `promotion_id` bigint unsigned NOT NULL,
  `code` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `max_redemptions` int unsigned DEFAULT NULL,
  `redeemed_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `promotion_id` (`promotion_id`),
  CONSTRAINT `promotion_codes_ibfk_1` FOREIGN KEY (`promotion_id`) REFERENCES `promotions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promotion_codes`
--

LOCK TABLES `promotion_codes` WRITE;
/*!40000 ALTER TABLE `promotion_codes` DISABLE KEYS */;
/*!40000 ALTER TABLE `promotion_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promotions`
--

DROP TABLE IF EXISTS `promotions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promotions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `percent_off` decimal(5,2) DEFAULT NULL,
  `flat_off_cents` int unsigned DEFAULT NULL,
  `starts_at` datetime NOT NULL,
  `ends_at` datetime NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promotions`
--

LOCK TABLES `promotions` WRITE;
/*!40000 ALTER TABLE `promotions` DISABLE KEYS */;
/*!40000 ALTER TABLE `promotions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seat_locks`
--

DROP TABLE IF EXISTS `seat_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seat_locks` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `showtime_id` bigint unsigned NOT NULL,
  `seat_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `locked_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_lock` (`showtime_id`,`seat_id`),
  KEY `seat_id` (`seat_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `seat_locks_ibfk_1` FOREIGN KEY (`showtime_id`) REFERENCES `showtimes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `seat_locks_ibfk_2` FOREIGN KEY (`seat_id`) REFERENCES `seats` (`id`) ON DELETE CASCADE,
  CONSTRAINT `seat_locks_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seat_locks`
--

LOCK TABLES `seat_locks` WRITE;
/*!40000 ALTER TABLE `seat_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `seat_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seats`
--

DROP TABLE IF EXISTS `seats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seats` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `auditorium_id` int unsigned NOT NULL,
  `row_label` varchar(4) COLLATE utf8mb4_unicode_ci NOT NULL,
  `seat_number` int unsigned NOT NULL,
  `seat_type` enum('STANDARD','ACCESSIBLE','PREMIUM') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'STANDARD',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_aud_row_seat` (`auditorium_id`,`row_label`,`seat_number`),
  CONSTRAINT `seats_ibfk_1` FOREIGN KEY (`auditorium_id`) REFERENCES `auditoriums` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=129 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seats`
--

LOCK TABLES `seats` WRITE;
/*!40000 ALTER TABLE `seats` DISABLE KEYS */;
INSERT INTO `seats` VALUES (1,1,'H',1,'STANDARD'),(2,1,'G',1,'STANDARD'),(3,1,'F',1,'STANDARD'),(4,1,'E',1,'STANDARD'),(5,1,'D',1,'STANDARD'),(6,1,'C',1,'STANDARD'),(7,1,'B',1,'STANDARD'),(8,1,'A',1,'STANDARD'),(9,1,'H',2,'STANDARD'),(10,1,'G',2,'STANDARD'),(11,1,'F',2,'STANDARD'),(12,1,'E',2,'STANDARD'),(13,1,'D',2,'STANDARD'),(14,1,'C',2,'STANDARD'),(15,1,'B',2,'STANDARD'),(16,1,'A',2,'STANDARD'),(17,1,'H',3,'STANDARD'),(18,1,'G',3,'STANDARD'),(19,1,'F',3,'STANDARD'),(20,1,'E',3,'STANDARD'),(21,1,'D',3,'STANDARD'),(22,1,'C',3,'STANDARD'),(23,1,'B',3,'STANDARD'),(24,1,'A',3,'STANDARD'),(25,1,'H',4,'STANDARD'),(26,1,'G',4,'STANDARD'),(27,1,'F',4,'STANDARD'),(28,1,'E',4,'STANDARD'),(29,1,'D',4,'STANDARD'),(30,1,'C',4,'STANDARD'),(31,1,'B',4,'STANDARD'),(32,1,'A',4,'STANDARD'),(33,1,'H',5,'STANDARD'),(34,1,'G',5,'STANDARD'),(35,1,'F',5,'STANDARD'),(36,1,'E',5,'STANDARD'),(37,1,'D',5,'STANDARD'),(38,1,'C',5,'STANDARD'),(39,1,'B',5,'STANDARD'),(40,1,'A',5,'STANDARD'),(41,1,'H',6,'STANDARD'),(42,1,'G',6,'STANDARD'),(43,1,'F',6,'STANDARD'),(44,1,'E',6,'STANDARD'),(45,1,'D',6,'STANDARD'),(46,1,'C',6,'STANDARD'),(47,1,'B',6,'STANDARD'),(48,1,'A',6,'STANDARD'),(49,1,'H',7,'STANDARD'),(50,1,'G',7,'STANDARD'),(51,1,'F',7,'STANDARD'),(52,1,'E',7,'STANDARD'),(53,1,'D',7,'STANDARD'),(54,1,'C',7,'STANDARD'),(55,1,'B',7,'STANDARD'),(56,1,'A',7,'STANDARD'),(57,1,'H',8,'STANDARD'),(58,1,'G',8,'STANDARD'),(59,1,'F',8,'STANDARD'),(60,1,'E',8,'STANDARD'),(61,1,'D',8,'STANDARD'),(62,1,'C',8,'STANDARD'),(63,1,'B',8,'STANDARD'),(64,1,'A',8,'STANDARD'),(65,1,'H',9,'STANDARD'),(66,1,'G',9,'STANDARD'),(67,1,'F',9,'STANDARD'),(68,1,'E',9,'STANDARD'),(69,1,'D',9,'STANDARD'),(70,1,'C',9,'STANDARD'),(71,1,'B',9,'STANDARD'),(72,1,'A',9,'STANDARD'),(73,1,'H',10,'STANDARD'),(74,1,'G',10,'STANDARD'),(75,1,'F',10,'STANDARD'),(76,1,'E',10,'STANDARD'),(77,1,'D',10,'STANDARD'),(78,1,'C',10,'STANDARD'),(79,1,'B',10,'STANDARD'),(80,1,'A',10,'STANDARD');
/*!40000 ALTER TABLE `seats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `showtimes`
--

DROP TABLE IF EXISTS `showtimes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `showtimes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `movie_id` bigint unsigned NOT NULL,
  `auditorium_id` int unsigned NOT NULL,
  `starts_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_auditorium_start` (`auditorium_id`,`starts_at`),
  KEY `idx_showtimes_movie_time` (`movie_id`,`starts_at`),
  CONSTRAINT `showtimes_ibfk_1` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `showtimes_ibfk_2` FOREIGN KEY (`auditorium_id`) REFERENCES `auditoriums` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `showtimes`
--

LOCK TABLES `showtimes` WRITE;
/*!40000 ALTER TABLE `showtimes` DISABLE KEYS */;
INSERT INTO `showtimes` VALUES (1,1,1,'2025-10-06 17:07:29'),(2,2,1,'2025-10-08 19:07:29'),(3,1,1,'2025-10-06 17:24:00'),(4,2,1,'2025-10-08 19:24:00');
/*!40000 ALTER TABLE `showtimes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tickets`
--

DROP TABLE IF EXISTS `tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tickets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ticket_number` char(16) COLLATE utf8mb4_unicode_ci NOT NULL,
  `booking_id` bigint unsigned NOT NULL,
  `showtime_id` bigint unsigned NOT NULL,
  `seat_id` bigint unsigned NOT NULL,
  `age_category` enum('CHILD','ADULT','SENIOR') COLLATE utf8mb4_unicode_ci NOT NULL,
  `price_cents` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ticket_number` (`ticket_number`),
  UNIQUE KEY `uq_showtime_seat` (`showtime_id`,`seat_id`),
  KEY `booking_id` (`booking_id`),
  KEY `seat_id` (`seat_id`),
  KEY `idx_tickets_showtime` (`showtime_id`),
  CONSTRAINT `tickets_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tickets_ibfk_2` FOREIGN KEY (`showtime_id`) REFERENCES `showtimes` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `tickets_ibfk_3` FOREIGN KEY (`seat_id`) REFERENCES `seats` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tickets`
--

LOCK TABLES `tickets` WRITE;
/*!40000 ALTER TABLE `tickets` DISABLE KEYS */;
/*!40000 ALTER TABLE `tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(320) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varbinary(72) NOT NULL,
  `first_name` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_suspended` tinyint(1) NOT NULL DEFAULT '0',
  `email_verified_at` datetime DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_phone` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin@ecinema.local',_binary '<paste_bcrypt_hash_here>','Admin','User',NULL,0,'2025-10-03 22:04:46',NULL,'2025-10-03 22:04:46','2025-10-03 22:04:46');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_users_no_email_update` BEFORE UPDATE ON `users` FOR EACH ROW BEGIN
  IF NEW.email <> OLD.email THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email cannot be changed';
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Temporary view structure for view `v_coming_soon`
--

DROP TABLE IF EXISTS `v_coming_soon`;
/*!50001 DROP VIEW IF EXISTS `v_coming_soon`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_coming_soon` AS SELECT 
 1 AS `movie_id`,
 1 AS `title`,
 1 AS `mpaa_rating`,
 1 AS `first_show`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_now_playing`
--

DROP TABLE IF EXISTS `v_now_playing`;
/*!50001 DROP VIEW IF EXISTS `v_now_playing`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_now_playing` AS SELECT 
 1 AS `movie_id`,
 1 AS `title`,
 1 AS `mpaa_rating`,
 1 AS `first_show`,
 1 AS `last_show`*/;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `v_coming_soon`
--

/*!50001 DROP VIEW IF EXISTS `v_coming_soon`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_coming_soon` AS select `m`.`id` AS `movie_id`,`m`.`title` AS `title`,`m`.`mpaa_rating` AS `mpaa_rating`,min(`s`.`starts_at`) AS `first_show` from (`movies` `m` join `showtimes` `s` on((`s`.`movie_id` = `m`.`id`))) where (`s`.`starts_at` > now()) group by `m`.`id`,`m`.`title`,`m`.`mpaa_rating` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_now_playing`
--

/*!50001 DROP VIEW IF EXISTS `v_now_playing`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_now_playing` AS select `m`.`id` AS `movie_id`,`m`.`title` AS `title`,`m`.`mpaa_rating` AS `mpaa_rating`,min(`s`.`starts_at`) AS `first_show`,max(`s`.`starts_at`) AS `last_show` from (`movies` `m` join `showtimes` `s` on((`s`.`movie_id` = `m`.`id`))) where (`s`.`starts_at` between (now() - interval 1 day) and (now() + interval 14 day)) group by `m`.`id`,`m`.`title`,`m`.`mpaa_rating` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-04  1:36:26
