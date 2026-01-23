-- phpMyAdmin SQL Dump
-- version 5.2.2deb1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jan 23, 2026 at 03:06 PM
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
(2, 'core_center', 'Skill Tree', './assets/img/player_projectile.png', 'Unlocks access to all upgrade paths.', 0, 0, 5, 5, 1, NULL, NULL),
(3, 'fire_rate_top', 'Rapid Fire', './assets/img/player_projectile.png', 'Increases your fire rate. Each level lets you shoot faster.', 0, 2, 12, 10, 5, 'fire_rate', 0.125),
(4, 'coin_gain_bottom', 'Loot Boost', './assets/img/coin.png', 'Earn more coins from destroyed aliens. Each level increases coin gains.', 0, -2, 10, 8, 5, 'coin_gain', 0.34),
(5, 'max_health_left', 'Hull Plating', './assets/img/player/player.png', 'Reinforces your hull, increasing max health and survivability.', -2, 0, 12, 9, 5, 'max_health', 1),
(6, 'crit_right', 'Critical Systems', './assets/img/crit_projectile.png', 'Upgrades targeting systems so some shots deal critical damage.', 2, 0, 14, 12, 5, 'crit_chance', 0.03);

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
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `player_stats`
--
ALTER TABLE `player_stats`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;

--
-- AUTO_INCREMENT for table `skills`
--
ALTER TABLE `skills`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

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
