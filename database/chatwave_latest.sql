-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: chatwave
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `friend_message_deletions`
--

DROP TABLE IF EXISTS `friend_message_deletions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `friend_message_deletions` (
  `message_id` bigint NOT NULL,
  `user_id` int NOT NULL,
  `deleted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`message_id`,`user_id`),
  KEY `fk_friend_message_deletions_user` (`user_id`),
  CONSTRAINT `fk_friend_message_deletions_message` FOREIGN KEY (`message_id`) REFERENCES `friend_messages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_friend_message_deletions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `friend_message_deletions`
--

LOCK TABLES `friend_message_deletions` WRITE;
/*!40000 ALTER TABLE `friend_message_deletions` DISABLE KEYS */;
/*!40000 ALTER TABLE `friend_message_deletions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `friend_messages`
--

DROP TABLE IF EXISTS `friend_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `friend_messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `conversation_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sender_id` int NOT NULL,
  `receiver_id` int NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `recalled_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_friend_messages_conversation` (`conversation_id`,`created_at`),
  KEY `fk_friend_messages_sender` (`sender_id`),
  KEY `fk_friend_messages_receiver` (`receiver_id`),
  CONSTRAINT `fk_friend_messages_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_friend_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `friend_messages`
--

LOCK TABLES `friend_messages` WRITE;
/*!40000 ALTER TABLE `friend_messages` DISABLE KEYS */;
INSERT INTO `friend_messages` VALUES (1,'1_2',2,1,'alo','2026-08-01 19:11:13',NULL),(2,'1_2',1,2,'nghe bn','2026-08-01 19:11:19',NULL),(3,'1_2',1,2,'alo','2026-08-01 19:11:35',NULL),(4,'1_2',2,1,'alo','2026-08-01 19:11:40',NULL),(5,'1_2',1,2,'bn oi','2026-08-01 19:12:04',NULL),(6,'1_2',2,1,'<a href=\"/uploads/files/d44dc3e3-da03-4221-a34e-a7cbede0b96d.jpg\" target=\"_blank\" style=\"color: inherit; text-decoration: underline; display: flex; align-items: center; gap: 6px;\">? images.jpg</a>','2026-08-01 19:12:27',NULL),(7,'1_2',1,2,'<img src=\"/uploads/images/6a4b1075-ad84-4e66-b686-14cf6b62d938.jpg\" alt=\"img\" style=\"max-width:150px; border-radius:8px;\" />','2026-08-01 19:12:39',NULL),(8,'1_2',1,2,'alo','2026-08-01 19:16:54',NULL),(9,'1_2',2,1,'nghe','2026-08-01 19:16:58',NULL),(10,'1_2',2,1,'<img src=\"http://localhost:5000/uploads/images/65e23d16-91d3-4419-a2a0-54aba81ffd1a.jpg\" alt=\"img\" style=\"max-width:150px; border-radius:8px;\" />','2026-08-01 19:17:16',NULL),(11,'1_2',1,2,'?','2026-08-01 19:17:30',NULL),(12,'1_2',2,1,'<a href=\"http://localhost:5000/uploads/files/9d3d9dba-866a-4a94-80cc-bbf98055973d.docx\" target=\"_blank\" style=\"color: inherit; text-decoration: underline; display: flex; align-items: center; gap: 6px;\">? Nhiệm vụ đồ án-2400001478-Nguyễn Đặng Tấn Phát.docx</a>','2026-08-01 19:18:35',NULL),(13,'1_2',2,1,'hehe','2026-08-01 19:18:42',NULL),(14,'1_2',2,1,'alo','2026-08-01 19:21:06',NULL),(15,'1_2',2,1,'nghe','2026-08-01 19:21:09',NULL),(16,'1_2',1,2,'alo','2026-08-01 19:23:13',NULL),(17,'1_2',2,1,'ha bn','2026-08-01 19:23:19',NULL),(18,'1_2',1,2,'oi fen','2026-08-01 19:30:47',NULL),(19,'1_2',1,2,'oi fen','2026-08-01 19:34:40','2026-08-01 21:41:39'),(20,'2_5',5,2,'alo','2026-08-01 19:38:34',NULL),(21,'2_5',2,5,'nghe ban','2026-08-01 19:38:39',NULL),(22,'2_7',7,2,'alo','2026-08-01 19:47:25',NULL),(23,'2_8',8,2,'alo','2026-08-01 20:09:11',NULL),(24,'2_5',2,5,'<a href=\"http://localhost:5000/uploads/files/cca3a78d-3ac8-47d4-928c-8dbc7f79b773.pdf\" target=\"_blank\" style=\"color: inherit; text-decoration: underline; display: flex; align-items: center; gap: 6px;\">? Quy định thực hiện TIểu luận - Đồ án.pdf</a>','2026-08-01 20:09:44',NULL),(25,'1_2',2,1,'chat:v1:{\"text\":\"alo\",\"attachment\":null}','2026-08-01 21:17:58',NULL),(26,'1_2',2,1,'chat:v1:{\"text\":\"oi fen\",\"attachment\":null}','2026-08-01 21:41:21',NULL),(27,'1_9',1,9,'chat:v1:{\"text\":\"abc\",\"attachment\":null}','2026-08-04 06:22:33',NULL),(28,'1_9',9,1,'chat:v1:{\"text\":\"aabc\",\"attachment\":null}','2026-08-04 06:22:43',NULL),(29,'1_9',9,1,'chat:v1:{\"text\":\"\",\"attachment\":{\"url\":\"/uploads/images/3c0e4489-30ca-42a9-b6f0-dd13f8684b80.jpg\",\"type\":\"image\",\"name\":\"images.jpg\"}}','2026-08-04 06:23:52','2026-08-04 06:25:37'),(30,'1_9',9,1,'chat:v1:{\"text\":\"https://www.youtube.com/?app=desktop&hl=vi\",\"attachment\":null}','2026-08-04 06:25:07',NULL),(31,'1_9',1,9,'chat:v1:{\"text\":\"\",\"attachment\":{\"url\":\"/uploads/files/658f096c-c869-4db4-856d-ae44ac695e58.webp\",\"type\":\"file\",\"name\":\"2024_2_5_638427405635366659_avt-cho-cute.webp\"}}','2026-08-04 06:33:21',NULL),(32,'1_9',1,9,'chat:v1:{\"text\":\"\",\"attachment\":{\"url\":\"/uploads/files/81ed87e0-8462-4d59-88ad-29a8445fd0d9.jpg\",\"type\":\"file\",\"name\":\"images.jpg\"}}','2026-08-04 06:33:32',NULL),(33,'1_9',1,9,'chat:v1:{\"text\":\"\",\"attachment\":{\"url\":\"/uploads/images/3c2e08ac-875f-49c1-a3f9-a155dff5353e.jpg\",\"type\":\"image\",\"name\":\"hinh-nen-may-tinh-chill-20.jpg\"}}','2026-08-04 06:37:32',NULL),(34,'1_9',1,9,'chat:v1:{\"text\":\"\",\"attachment\":{\"url\":\"/uploads/images/9e8a4c7f-a83e-4e52-b20a-b8aaff5e2bd8.webp\",\"type\":\"image\",\"name\":\"2024_2_5_638427405635366659_avt-cho-cute.webp\"}}','2026-08-04 06:37:36',NULL),(35,'1_9',1,9,'chat:v1:{\"text\":\"\",\"attachment\":{\"url\":\"/uploads/images/7f7dbb1d-97c4-437a-82d8-165b35e7b029.jpg\",\"type\":\"image\",\"name\":\"giong_meo_ragdoll2.jpg\"}}','2026-08-04 06:37:46',NULL);
/*!40000 ALTER TABLE `friend_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `friend_requests`
--

DROP TABLE IF EXISTS `friend_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `friend_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sender_id` int NOT NULL,
  `receiver_id` int NOT NULL,
  `status` enum('pending','accepted','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sender_id` (`sender_id`),
  KEY `receiver_id` (`receiver_id`),
  CONSTRAINT `fk_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `friend_requests`
--

LOCK TABLES `friend_requests` WRITE;
/*!40000 ALTER TABLE `friend_requests` DISABLE KEYS */;
INSERT INTO `friend_requests` VALUES (1,5,1,'accepted','2026-07-28 20:42:11'),(2,5,2,'accepted','2026-07-28 21:30:49'),(3,2,1,'accepted','2026-07-28 22:31:24'),(4,1,6,'pending','2026-07-29 03:23:21'),(5,7,2,'accepted','2026-08-01 19:46:32'),(6,8,2,'accepted','2026-08-01 20:08:30'),(7,9,1,'accepted','2026-08-04 06:22:08');
/*!40000 ALTER TABLE `friend_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `matches`
--

DROP TABLE IF EXISTS `matches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `matches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user1_id` int NOT NULL,
  `user2_id` int NOT NULL,
  `started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ended_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_match_user1` (`user1_id`),
  KEY `fk_match_user2` (`user2_id`),
  CONSTRAINT `fk_match_user1` FOREIGN KEY (`user1_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_match_user2` FOREIGN KEY (`user2_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `matches`
--

LOCK TABLES `matches` WRITE;
/*!40000 ALTER TABLE `matches` DISABLE KEYS */;
/*!40000 ALTER TABLE `matches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `match_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sender_id` int NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_comments`
--

DROP TABLE IF EXISTS `post_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_comments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `post_id` bigint NOT NULL,
  `user_id` int NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `recalled_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `post_id` (`post_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `post_comments_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `post_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_comments`
--

LOCK TABLES `post_comments` WRITE;
/*!40000 ALTER TABLE `post_comments` DISABLE KEYS */;
INSERT INTO `post_comments` VALUES (13,3,8,'comment:v1:{\"text\":\"dep ghe\",\"image\":null}',NULL,'2026-08-01 21:16:39'),(14,3,8,'comment:v1:{\"text\":\"thay giong ko\",\"image\":\"/uploads/images/11a7fefe-0794-4260-9dda-80af640ea103.jpg\"}',NULL,'2026-08-01 21:16:53');
/*!40000 ALTER TABLE `post_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_likes`
--

DROP TABLE IF EXISTS `post_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_likes` (
  `post_id` bigint NOT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`post_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `post_likes_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `post_likes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_likes`
--

LOCK TABLES `post_likes` WRITE;
/*!40000 ALTER TABLE `post_likes` DISABLE KEYS */;
INSERT INTO `post_likes` VALUES (3,2),(3,8),(7,9);
/*!40000 ALTER TABLE `post_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `posts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recalled_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_posts_created` (`created_at`),
  KEY `fk_posts_user` (`user_id`),
  CONSTRAINT `fk_posts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posts`
--

LOCK TABLES `posts` WRITE;
/*!40000 ALTER TABLE `posts` DISABLE KEYS */;
INSERT INTO `posts` VALUES (3,8,'meo trang ne','/uploads/images/182b5f29-1a58-4450-876a-19c2cbce6dd4.jpg',NULL,'2026-08-01 21:16:32'),(7,9,'abc','/uploads/images/b9c2b87d-fb55-4bbd-a54c-97f2a409b5b3.jpg',NULL,'2026-08-04 06:28:49');
/*!40000 ALTER TABLE `posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reporter_id` int NOT NULL,
  `reported_id` int NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_report_reporter` (`reporter_id`),
  KEY `fk_report_reported` (`reported_id`),
  CONSTRAINT `fk_report_reported` FOREIGN KEY (`reported_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_report_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fullName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'default.png',
  `cover_image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` enum('Nam','Nữ','Khác') COLLATE utf8mb4_unicode_ci DEFAULT 'Khác',
  `country` varchar(2) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'VN',
  `status` enum('online','offline') COLLATE utf8mb4_unicode_ci DEFAULT 'offline',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `provider` enum('local','google') COLLATE utf8mb4_unicode_ci DEFAULT 'local',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Phat_Nguyen','Tui ten La Phat','nguyendangtanphat11@gmail.com','$2b$10$/KZ2aXGdEMpGULhXJ2gbV.ypUXQdwazX8rSmvygEbamBQRpcp9VpK','/uploads/images/41797992-1b8b-4aaf-99e6-157e7223e637.jpg','/uploads/covers/c99e08ba-88a4-4372-9915-0de05b059318.jpg','Nam','VN','offline','2026-06-25 19:53:18','2026-08-30 15:21:32','local'),(2,'tan',NULL,'admin@gmail.com','$2b$10$4d4SxnOM98ROhS7zMed2m.dL3bhbBjgL2yc9hG2GSTO4Hi1UqTYxm','/uploads/images/1b4dd199-6d9a-4457-8aef-a28bad8ba094.jpg',NULL,'Nam','VN','offline','2026-06-25 21:13:20','2026-08-02 07:38:40','local'),(3,'phat2',NULL,'phat@gmail.com','$2b$10$D5r/qu8m9KsiFshpINO4yeWVjWtn/ZXJs7nKMXd3SSU.6EDruvP2G','/default.png',NULL,'Nam','VN','offline','2026-06-26 00:59:14','2026-08-01 18:21:07','local'),(4,'tien',NULL,'TIENDUONGDANGTAN@GMAIL.COM','$2b$10$TUUbuFK2LK.JY9lEFv358OwJBK/K/VGr96B15eOzyHCqWRUskjF5i','/default.png',NULL,'Nam','VN','offline','2026-06-26 11:21:27','2026-08-01 18:21:07','local'),(5,'Phat Nguyen','phat','phatnonono@gmail.com','','https://lh3.googleusercontent.com/a/ACg8ocLaR4yl0n9sgkVHQRzdTapThNuZzvtnGmKEZdJLvthF-1RAqXGd=s96-c',NULL,'Nam','VN','offline','2026-07-28 18:48:22','2026-08-30 14:30:55','google'),(6,'bvv',NULL,'b@gmail.com','$2b$10$yCmOXCHSO33GndfEzOFZRuajEEwoY0XfF6iXBxH8k5Frie8SUvHXS','/default.png',NULL,'Nam','VN','online','2026-07-29 03:22:38','2026-08-01 18:21:07','local'),(7,'Myhihi',NULL,'My@gmail.com','$2b$10$.JmaI3Raqc0UQNHlHd3/fOZBU7a3jHIw25ob4Y5qFr6WXb/gGzguO','/uploads/images/c488507c-6ccd-451e-b5b0-7d137f282d26.jpg','/uploads/covers/6808edb2-ea04-4b43-a9f0-8590bac3523a.jpg','Nữ','VN','offline','2026-08-01 19:44:05','2026-08-01 20:04:41','local'),(8,'NamLo',NULL,'nam@gmail.com','$2b$10$yEVw4tcIuIwG8MIx9W1QmOW3KJl8GK4p5rB/zG0DEjJKuMQgac4r.','default.png',NULL,'Nam','VN','offline','2026-08-01 20:05:05','2026-08-01 21:20:15','local'),(9,'abc',NULL,'abc@gmail.com','$2b$10$oaiCWHTg1wANd/ORtWhMFu6qLuoFvHFG9mJuEEh17qnK7WXhtqOyG','default.png',NULL,'Nữ','VN','offline','2026-08-04 06:18:37','2026-08-04 06:42:07','local');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-31  0:27:09
