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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Phat_Nguyen','Tui ten La Phat','nguyendangtanphat11@gmail.com','$2b$10$/KZ2aXGdEMpGULhXJ2gbV.ypUXQdwazX8rSmvygEbamBQRpcp9VpK','/uploads/images/41797992-1b8b-4aaf-99e6-157e7223e637.jpg','/uploads/covers/c99e08ba-88a4-4372-9915-0de05b059318.jpg','Nam','VN','online','2026-06-25 19:53:18','2026-08-01 22:20:41','local'),(2,'tan',NULL,'admin@gmail.com','$2b$10$4d4SxnOM98ROhS7zMed2m.dL3bhbBjgL2yc9hG2GSTO4Hi1UqTYxm','/uploads/images/1b4dd199-6d9a-4457-8aef-a28bad8ba094.jpg',NULL,'Nam','VN','offline','2026-06-25 21:13:20','2026-08-01 22:43:27','local'),(3,'phat2',NULL,'phat@gmail.com','$2b$10$D5r/qu8m9KsiFshpINO4yeWVjWtn/ZXJs7nKMXd3SSU.6EDruvP2G','/default.png',NULL,'Nam','VN','offline','2026-06-26 00:59:14','2026-08-01 18:21:07','local'),(4,'tien',NULL,'TIENDUONGDANGTAN@GMAIL.COM','$2b$10$TUUbuFK2LK.JY9lEFv358OwJBK/K/VGr96B15eOzyHCqWRUskjF5i','/default.png',NULL,'Nam','VN','offline','2026-06-26 11:21:27','2026-08-01 18:21:07','local'),(5,'Phat Nguyen','phat','phatnonono@gmail.com','','https://lh3.googleusercontent.com/a/ACg8ocLaR4yl0n9sgkVHQRzdTapThNuZzvtnGmKEZdJLvthF-1RAqXGd=s96-c',NULL,'Nam','VN','offline','2026-07-28 18:48:22','2026-08-01 19:43:12','google'),(6,'bvv',NULL,'b@gmail.com','$2b$10$yCmOXCHSO33GndfEzOFZRuajEEwoY0XfF6iXBxH8k5Frie8SUvHXS','/default.png',NULL,'Nam','VN','online','2026-07-29 03:22:38','2026-08-01 18:21:07','local'),(7,'Myhihi',NULL,'My@gmail.com','$2b$10$.JmaI3Raqc0UQNHlHd3/fOZBU7a3jHIw25ob4Y5qFr6WXb/gGzguO','/uploads/images/c488507c-6ccd-451e-b5b0-7d137f282d26.jpg','/uploads/covers/6808edb2-ea04-4b43-a9f0-8590bac3523a.jpg','Nữ','VN','offline','2026-08-01 19:44:05','2026-08-01 20:04:41','local'),(8,'NamLo',NULL,'nam@gmail.com','$2b$10$yEVw4tcIuIwG8MIx9W1QmOW3KJl8GK4p5rB/zG0DEjJKuMQgac4r.','default.png',NULL,'Nam','VN','offline','2026-08-01 20:05:05','2026-08-01 21:20:15','local');
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

-- Dump completed on 2026-08-02  5:58:48
