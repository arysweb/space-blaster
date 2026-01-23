-- phpMyAdmin SQL Dump
-- version 5.2.2deb1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jan 23, 2026 at 11:47 AM
-- Server version: 8.4.7-0ubuntu0.25.04.2
-- PHP Version: 8.4.5

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `space_blaster`
--

-- --------------------------------------------------------

--
-- Table structure for table `players`
--

CREATE TABLE `players` (
  `id` int UNSIGNED NOT NULL,
  `name` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_seen_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `players`
--

INSERT INTO `players` (`id`, `name`, `created_at`, `last_seen_at`) VALUES
(8, 'Sebas', '2026-01-23 11:39:07', '2026-01-23 11:39:07');

-- --------------------------------------------------------

--
-- Table structure for table `player_skills`
--

CREATE TABLE `player_skills` (
  `player_id` int UNSIGNED NOT NULL,
  `skill_id` int NOT NULL,
  `current_level` tinyint UNSIGNED NOT NULL DEFAULT '1',
  `unlocked_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `player_skills`
--

INSERT INTO `player_skills` (`player_id`, `skill_id`, `current_level`, `unlocked_at`) VALUES
(8, 2, 1, '2026-01-23 11:39:35');

-- --------------------------------------------------------

--
-- Table structure for table `player_stats`
--

CREATE TABLE `player_stats` (
  `id` bigint UNSIGNED NOT NULL,
  `player_id` int UNSIGNED NOT NULL,
  `started_at` datetime NOT NULL,
  `ended_at` datetime NOT NULL,
  `minutes_played` int UNSIGNED NOT NULL,
  `kills` int UNSIGNED NOT NULL DEFAULT '0',
  `deaths` int UNSIGNED NOT NULL DEFAULT '0',
  `score` int UNSIGNED NOT NULL DEFAULT '0',
  `coins` int UNSIGNED NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `player_stats`
--

INSERT INTO `player_stats` (`id`, `player_id`, `started_at`, `ended_at`, `minutes_played`, `kills`, `deaths`, `score`, `coins`) VALUES
(27, 8, '2026-01-23 11:39:30', '2026-01-23 11:39:30', 0, 5, 1, 5, 5),
(28, 8, '2026-01-23 11:40:08', '2026-01-23 11:40:08', 0, 0, 1, 0, 0),
(29, 8, '2026-01-23 11:43:08', '2026-01-23 11:43:08', 0, 0, 1, 0, 0),
(30, 8, '2026-01-23 11:45:04', '2026-01-23 11:45:04', 0, 2, 1, 2, 2),
(31, 8, '2026-01-23 11:45:50', '2026-01-23 11:45:50', 1, 9, 1, 9, 9);

-- --------------------------------------------------------

--
-- Table structure for table `skills`
--

CREATE TABLE `skills` (
  `id` int NOT NULL,
  `key` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT './assets/img/player_projectile.png',
  `description` text COLLATE utf8mb4_unicode_ci,
  `x` int NOT NULL,
  `y` int NOT NULL,
  `base_cost` int NOT NULL DEFAULT '10',
  `cost_per_level` int NOT NULL DEFAULT '5',
  `max_level` tinyint NOT NULL DEFAULT '5',
  `effect_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `effect_value_per_level` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `skills`
--

INSERT INTO `skills` (`id`, `key`, `name`, `icon`, `description`, `x`, `y`, `base_cost`, `cost_per_level`, `max_level`, `effect_type`, `effect_value_per_level`) VALUES
(2, 'core_center', 'Skill Tree', './assets/img/player_projectile.png', 'Unlocks access to all upgrade paths.', 0, 0, 5, 5, 1, 'global_power', 2);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `players`
--
ALTER TABLE `players`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `player_skills`
--
ALTER TABLE `player_skills`
  ADD PRIMARY KEY (`player_id`,`skill_id`),
  ADD KEY `idx_player_skill` (`player_id`,`skill_id`),
  ADD KEY `fk_player_skills_skill` (`skill_id`);

--
-- Indexes for table `player_stats`
--
ALTER TABLE `player_stats`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_player_time` (`player_id`,`started_at`),
  ADD KEY `idx_started_at` (`started_at`);

--
-- Indexes for table `skills`
--
ALTER TABLE `skills`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `key` (`key`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `players`
--
ALTER TABLE `players`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `player_stats`
--
ALTER TABLE `player_stats`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `skills`
--
ALTER TABLE `skills`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `player_skills`
--
ALTER TABLE `player_skills`
  ADD CONSTRAINT `fk_player_skills_player` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_player_skills_skill` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `player_stats`
--
ALTER TABLE `player_stats`
  ADD CONSTRAINT `fk_player_stats_player` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
