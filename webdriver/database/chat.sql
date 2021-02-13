-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Erstellungszeit: 17. Jan 2021 um 18:47
-- Server-Version: 10.4.13-MariaDB
-- PHP-Version: 7.4.8

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Datenbank: `chat`
--

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `blockedusers`
--

CREATE TABLE `blockedusers` (
  `buid` int(11) NOT NULL,
  `uidFrom` int(11) NOT NULL,
  `uidAffected` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_german2_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `emailchange`
--

CREATE TABLE `emailchange` (
  `ecid` int(11) NOT NULL,
  `uid` int(11) NOT NULL,
  `vcid` int(11) NOT NULL,
  `newEmail` varchar(255) NOT NULL,
  `date` datetime NOT NULL,
  `isVerified` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `groupchat`
--

CREATE TABLE `groupchat` (
  `gcid` int(11) NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `description` varchar(4000) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `isPublic` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_german2_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `groupchatmember`
--

CREATE TABLE `groupchatmember` (
   `gcmid` int(11) NOT NULL,
   `uid` int(11) NOT NULL,
   `gcid` int(11) NOT NULL,
   `isAdmin` tinyint(1) NOT NULL,
   `unreadMessages` int(11) NOT NULL DEFAULT 0,
   `isStillMember` tinyint(4) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_german2_ci;

--
-- Daten für Tabelle `groupchatmember`
--

INSERT INTO `groupchatmember` (`gcmid`, `uid`, `gcid`, `isAdmin`, `unreadMessages`, `isStillMember`) VALUES
(1, 1, 1, 0, 0, 1),
(2, 3, 1, 0, 0, 1),
(3, 5, 1, 0, 0, 1),
(4, 12, 1, 1, 0, 1),
(5, 12, 2, 0, 0, 1),
(6, 22, 2, 0, 0, 1),
(7, 21, 2, 0, 0, 1),
(8, 3, 2, 1, 0, 1),
(9, 24, 3, 0, 0, 1),
(10, 25, 3, 0, 0, 1),
(11, 26, 3, 0, 0, 1),
(12, 27, 3, 0, 0, 1),
(13, 22, 3, 1, 0, 1),
(14, 23, 4, 0, 0, 1),
(15, 24, 4, 0, 0, 1),
(16, 25, 4, 0, 0, 1),
(17, 27, 4, 0, 0, 1),
(18, 26, 4, 0, 0, 1),
(19, 22, 4, 1, 0, 1),
(20, 24, 5, 0, 0, 1),
(21, 23, 5, 0, 0, 1),
(22, 25, 5, 0, 0, 1),
(23, 26, 5, 0, 0, 1),
(24, 27, 5, 0, 0, 1),
(25, 22, 5, 1, 0, 1),
(26, 23, 6, 0, 0, 1),
(27, 24, 6, 0, 0, 1),
(28, 25, 6, 0, 0, 1),
(29, 26, 6, 0, 0, 1),
(30, 27, 6, 0, 0, 1),
(31, 22, 6, 1, 0, 1),
(32, 23, 7, 0, 0, 1),
(33, 24, 7, 0, 0, 1),
(34, 25, 7, 0, 0, 1),
(35, 26, 7, 0, 0, 1),
(36, 27, 7, 0, 0, 1),
(37, 22, 7, 1, 0, 1),
(38, 23, 8, 0, 0, 1),
(39, 24, 8, 0, 0, 1),
(40, 25, 8, 0, 0, 1),
(41, 26, 8, 0, 0, 1),
(42, 27, 8, 0, 0, 1),
(43, 22, 8, 1, 0, 1),
(44, 23, 9, 0, 0, 1),
(45, 24, 9, 0, 0, 1),
(46, 25, 9, 0, 0, 1),
(47, 26, 9, 0, 0, 1),
(48, 27, 9, 0, 0, 1),
(49, 22, 9, 1, 0, 1),
(50, 23, 10, 0, 0, 1),
(51, 24, 10, 0, 0, 1),
(52, 25, 10, 0, 0, 1),
(53, 26, 10, 0, 0, 1),
(54, 27, 10, 0, 0, 1),
(55, 22, 10, 1, 0, 1),
(56, 23, 11, 0, 0, 1),
(57, 24, 11, 0, 2, 1),
(58, 25, 11, 0, 2, 1),
(59, 26, 11, 0, 2, 1),
(60, 27, 11, 0, 2, 1),
(61, 22, 11, 1, 2, 1),
(62, 23, 12, 0, 0, 1),
(63, 25, 12, 0, 0, 1),
(64, 24, 12, 0, 0, 1),
(65, 26, 12, 0, 0, 1),
(66, 27, 12, 0, 0, 1),
(67, 22, 12, 1, 0, 1),
(68, 23, 13, 0, 0, 1),
(69, 24, 13, 0, 0, 1),
(70, 25, 13, 0, 0, 1),
(71, 26, 13, 0, 0, 1),
(72, 27, 13, 0, 0, 1),
(73, 22, 13, 1, 0, 1),
(74, 16, 14, 0, 0, 1),
(75, 17, 14, 0, 0, 1),
(76, 18, 14, 0, 0, 1),
(77, 19, 14, 0, 0, 1),
(78, 20, 14, 0, 0, 1),
(79, 21, 14, 0, 0, 1),
(80, 26, 14, 1, 0, 1),
(81, 16, 15, 0, 0, 1),
(82, 17, 15, 0, 0, 1),
(83, 18, 15, 0, 0, 1),
(84, 19, 15, 0, 0, 1),
(85, 20, 15, 0, 0, 1),
(86, 21, 15, 0, 0, 1),
(87, 26, 15, 1, 0, 1),
(88, 31, 16, 0, 0, 1),
(89, 33, 16, 0, 0, 1),
(90, 12, 16, 1, 0, 1),
(91, 31, 17, 0, 0, 1),
(92, 33, 17, 0, 0, 1),
(93, 12, 17, 1, 0, 1),
(94, 5, 18, 0, 0, 1),
(95, 6, 18, 0, 0, 1),
(96, 7, 18, 0, 0, 1),
(97, 8, 18, 0, 0, 1),
(98, 3, 18, 1, 0, 1),
(99, 3, 19, 0, 0, 1),
(100, 5, 19, 0, 0, 1),
(101, 6, 19, 0, 0, 1),
(102, 34, 19, 1, 0, 1),
(103, 1, 20, 0, 0, 1),
(104, 3, 20, 0, 0, 1),
(105, 5, 20, 0, 0, 1),
(106, 6, 20, 0, 0, 1),
(107, 7, 20, 0, 0, 1),
(108, 35, 20, 1, 0, 1),
(109, 1, 21, 0, 0, 1),
(110, 3, 21, 0, 0, 1),
(111, 5, 21, 0, 0, 1),
(112, 6, 21, 0, 0, 1),
(113, 36, 21, 1, 0, 1),
(114, 1, 22, 0, 0, 1),
(115, 3, 22, 0, 0, 1),
(116, 5, 22, 0, 0, 1),
(117, 37, 22, 1, 0, 1),
(118, 28, 23, 0, 0, 1),
(119, 29, 23, 0, 0, 1),
(120, 34, 23, 0, 0, 1),
(121, 35, 23, 0, 0, 1),
(122, 36, 23, 0, 0, 1),
(123, 39, 23, 1, 0, 1),
(124, 19, 24, 0, 0, 1),
(125, 20, 24, 0, 0, 1),
(126, 21, 24, 0, 0, 1),
(127, 22, 24, 0, 0, 1),
(128, 12, 24, 1, 0, 1),
(129, 5, 25, 0, 0, 1),
(130, 6, 25, 0, 0, 1),
(131, 7, 25, 0, 0, 1),
(132, 3, 25, 1, 0, 1),
(133, 5, 26, 0, 0, 1),
(134, 6, 26, 0, 0, 1),
(135, 7, 26, 0, 0, 1),
(136, 8, 26, 0, 0, 1),
(137, 12, 26, 0, 0, 1),
(138, 3, 26, 1, 0, 1),
(139, 1, 27, 0, 0, 1),
(140, 3, 27, 0, 0, 1),
(141, 5, 27, 0, 0, 1),
(142, 12, 27, 1, 0, 1),
(143, 1, 28, 0, 7, 1),
(144, 5, 28, 0, 7, 1),
(145, 3, 28, 0, 0, 1),
(146, 12, 28, 1, 0, 1),
(147, 9, 29, 0, 0, 1),
(148, 10, 29, 0, 0, 1),
(149, 11, 29, 0, 0, 1),
(150, 12, 29, 1, 0, 1),
(151, 12, 30, 1, 0, 1),
(152, 9, 30, 0, 2, 1),
(153, 10, 30, 0, 2, 1),
(154, 11, 30, 0, 2, 1),
(155, 12, 31, 1, 0, 1),
(156, 19, 31, 0, 0, 1),
(157, 20, 31, 0, 0, 1),
(158, 18, 31, 0, 0, 1),
(159, 21, 31, 0, 0, 1),
(160, 22, 31, 0, 0, 1),
(161, 40, 32, 1, 0, 1),
(162, 19, 32, 0, 0, 1),
(163, 20, 32, 0, 0, 1),
(164, 18, 32, 0, 0, 1),
(165, 21, 32, 0, 0, 1),
(166, 22, 32, 0, 0, 1),
(167, 40, 33, 1, 0, 1),
(168, 19, 33, 0, 0, 1),
(169, 20, 33, 0, 0, 1),
(170, 21, 33, 0, 0, 1),
(171, 22, 33, 0, 0, 1),
(172, 40, 34, 1, 0, 1),
(173, 6, 34, 0, 0, 1),
(174, 5, 34, 0, 0, 1),
(175, 7, 34, 0, 0, 1),
(176, 8, 34, 0, 0, 1),
(177, 40, 35, 1, 0, 1),
(178, 28, 35, 0, 0, 1),
(179, 29, 35, 0, 0, 1),
(180, 34, 35, 0, 0, 1),
(181, 35, 35, 0, 0, 1),
(182, 40, 36, 1, 0, 1),
(183, 18, 36, 0, 0, 1),
(184, 19, 36, 0, 0, 1),
(185, 20, 36, 0, 0, 1),
(186, 21, 36, 0, 0, 1),
(187, 40, 37, 1, 0, 1),
(188, 20, 37, 0, 0, 1),
(189, 19, 37, 0, 0, 1),
(190, 18, 37, 0, 0, 1),
(191, 21, 37, 0, 0, 1),
(192, 40, 38, 1, 0, 1),
(193, 17, 38, 0, 0, 1),
(194, 18, 38, 0, 0, 1),
(195, 20, 38, 0, 0, 1),
(196, 40, 39, 1, 0, 1),
(197, 19, 39, 0, 0, 1),
(198, 20, 39, 0, 0, 1),
(199, 21, 39, 0, 0, 1),
(200, 22, 39, 0, 0, 1),
(201, 40, 40, 1, 0, 1),
(202, 19, 40, 1, 0, 1),
(203, 20, 40, 0, 3, 0),
(204, 18, 40, 0, 3, 1),
(205, 17, 40, 0, 2, 1),
(206, 40, 41, 1, 0, 1),
(207, 29, 41, 0, 0, 1),
(208, 28, 41, 0, 0, 1),
(209, 27, 41, 0, 0, 1),
(210, 40, 43, 1, 0, 1),
(211, 29, 43, 0, 0, 1),
(212, 28, 43, 0, 0, 1),
(213, 27, 43, 0, 0, 1),
(214, 40, 44, 1, 0, 1),
(215, 19, 44, 0, 0, 1),
(216, 20, 44, 0, 0, 1),
(217, 21, 44, 0, 0, 1),
(218, 22, 44, 0, 0, 1),
(219, 40, 45, 1, 0, 1),
(220, 20, 45, 0, 0, 1),
(221, 19, 45, 0, 0, 1),
(222, 18, 45, 0, 0, 1),
(223, 21, 45, 0, 0, 1),
(224, 40, 46, 1, 0, 1),
(225, 20, 46, 0, 0, 1),
(226, 21, 46, 0, 0, 1),
(227, 19, 46, 0, 0, 1),
(228, 18, 46, 0, 0, 1),
(229, 40, 47, 1, 0, 1),
(230, 20, 47, 0, 0, 1),
(231, 21, 47, 0, 0, 1),
(232, 22, 47, 0, 0, 1),
(233, 19, 47, 0, 0, 1),
(234, 40, 48, 1, 0, 1),
(235, 18, 48, 0, 0, 1),
(236, 19, 48, 0, 0, 1),
(237, 20, 48, 0, 0, 1),
(238, 21, 48, 0, 0, 1),
(239, 40, 49, 1, 0, 1),
(240, 18, 49, 0, 0, 1),
(241, 19, 49, 0, 0, 1),
(242, 20, 49, 0, 0, 1),
(243, 12, 50, 1, 0, 1),
(244, 11, 50, 0, 2, 1),
(245, 10, 50, 0, 2, 1),
(246, 9, 50, 0, 2, 1),
(247, 17, 51, 1, 0, 1),
(248, 18, 51, 0, 1, 1),
(249, 19, 51, 0, 1, 1),
(250, 20, 51, 0, 1, 1),
(251, 21, 51, 0, 1, 1),
(252, 40, 52, 1, 0, 1),
(253, 19, 52, 0, 0, 1),
(254, 20, 52, 0, 0, 1),
(255, 21, 52, 0, 0, 1),
(256, 22, 52, 0, 0, 1),
(257, 12, 53, 1, 0, 1),
(258, 10, 53, 0, 0, 1),
(259, 11, 53, 0, 0, 1),
(260, 23, 40, 0, 0, 1),
(261, 24, 40, 0, 0, 1),
(262, 25, 40, 0, 0, 1),
(263, 23, 54, 1, 0, 1),
(264, 17, 54, 0, 0, 1),
(265, 19, 54, 0, 0, 1),
(266, 17, 11, 0, 2, 1),
(267, 19, 11, 0, 0, 1),
(268, 9, 11, 0, 2, 1),
(269, 10, 11, 0, 2, 1),
(270, 11, 11, 1, 2, 1),
(271, 46, 55, 1, 0, 0),
(272, 17, 55, 0, 1, 1),
(273, 18, 55, 0, 1, 1),
(274, 19, 55, 0, 1, 1),
(275, 25, 55, 1, 1, 1),
(276, 24, 55, 0, 1, 1),
(277, 20, 55, 0, 0, 1),
(278, 21, 55, 0, 0, 1),
(279, 22, 55, 0, 0, 1),
(280, 46, 56, 1, 0, 1),
(281, 22, 56, 0, 0, 1),
(282, 21, 56, 0, 0, 1),
(283, 20, 56, 0, 0, 1),
(284, 19, 56, 0, 0, 1),
(285, 18, 56, 0, 0, 1),
(286, 3, 57, 1, 0, 1),
(287, 12, 57, 0, 0, 1),
(288, 12, 58, 1, 0, 1),
(289, 3, 58, 0, 2, 1),
(290, 12, 59, 1, 0, 1),
(291, 3, 59, 0, 2, 0),
(292, 12, 60, 1, 0, 1),
(293, 3, 60, 0, 2, 0),
(294, 40, 61, 1, 0, 1),
(295, 17, 61, 0, 4, 0),
(296, 18, 61, 0, 4, 0),
(297, 19, 61, 0, 4, 0),
(298, 20, 61, 0, 4, 0),
(299, 22, 61, 0, 4, 0),
(300, 23, 61, 0, 4, 0),
(301, 24, 61, 0, 4, 0),
(302, 41, 61, 0, 4, 1),
(303, 42, 61, 0, 4, 1),
(304, 43, 61, 0, 4, 1),
(305, 39, 61, 0, 0, 0),
(306, 45, 61, 0, 4, 1),
(307, 46, 61, 0, 4, 1),
(308, 44, 61, 0, 4, 1),
(309, 38, 61, 0, 4, 1),
(310, 37, 61, 0, 4, 1),
(311, 39, 61, 0, 0, 1),
(312, 40, 62, 1, 0, 1),
(313, 17, 62, 0, 0, 1),
(314, 18, 62, 0, 0, 1),
(315, 19, 62, 0, 0, 1),
(316, 20, 62, 0, 0, 1),
(317, 40, 63, 1, 0, 1),
(318, 17, 63, 0, 0, 1),
(319, 18, 63, 0, 0, 1),
(320, 19, 63, 0, 0, 1),
(321, 20, 63, 0, 0, 1),
(322, 40, 64, 1, 0, 1),
(323, 17, 64, 0, 0, 1),
(324, 18, 64, 0, 0, 1),
(325, 19, 64, 0, 0, 1),
(326, 20, 64, 0, 0, 1);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `media`
--

CREATE TABLE `media` (
  `meid` int(11) NOT NULL,
  `nmid` int(11) NOT NULL,
  `type` int(11) NOT NULL,
  `pathToFile` varchar(255) COLLATE utf8_german2_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_german2_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `mentioneduser`
--

CREATE TABLE `mentioneduser` (
  `muid` int(11) NOT NULL,
  `nmid` int(11) NOT NULL,
  `uid` int(11) NOT NULL,
  `textColumn` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_german2_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `message`
--

CREATE TABLE `message` (
   `mid` int(11) NOT NULL,
   `date` datetime NOT NULL,
   `isGroupChat` tinyint(1) NOT NULL,
   `messageType` int(11) NOT NULL,
   `cid` int(11) NOT NULL,
   `uid` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

--
-- Daten für Tabelle `message`
--

INSERT INTO `message` (`mid`, `date`, `isGroupChat`, `messageType`, `cid`, `uid`) VALUES
(882, '2020-04-18 14:15:25', 0, 0, 1, 12),
(883, '2020-04-18 14:35:43', 0, 0, 1, 12);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `normalchat`
--

CREATE TABLE `normalchat` (
  `ncid` int(11) NOT NULL,
  `uid1` int(11) NOT NULL,
  `uid2` int(11) NOT NULL,
  `unreadMessages1` int(11) NOT NULL DEFAULT 0,
  `unreadMessages2` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_german2_ci;
--
-- Daten für Tabelle `normalchat`
--

INSERT INTO `normalchat` (`ncid`, `uid1`, `uid2`, `unreadMessages1`, `unreadMessages2`) VALUES
(1, 3, 12, 0, 0),
(3, 12, 16, 0, 0),
(4, 12, 17, 0, 0),
(5, 12, 18, 0, 4),
(8, 12, 6, 0, 0),
(9, 12, 8, 0, 0),
(10, 12, 5, 0, 0),
(11, 12, 11, 0, 0),
(12, 12, 7, 0, 0),
(13, 12, 15, 0, 0),
(14, 12, 10, 0, 0),
(15, 17, 3, 0, 0),
(16, 17, 1, 0, 0),
(17, 17, 5, 0, 0),
(18, 17, 6, 0, 0),
(19, 17, 7, 0, 0),
(20, 17, 15, 0, 0),
(21, 19, 3, 0, 0),
(22, 20, 3, 0, 0),
(23, 21, 3, 0, 0),
(24, 22, 3, 0, 0),
(25, 23, 3, 0, 0),
(26, 24, 3, 0, 0),
(27, 25, 3, 0, 0),
(28, 26, 3, 0, 0),
(29, 27, 3, 0, 0),
(30, 28, 3, 0, 0),
(31, 28, 27, 0, 0),
(32, 12, 30, 0, 0),
(33, 3, 5, 0, 0),
(34, 12, 9, 0, 0),
(35, 12, 13, 0, 0),
(36, 3, 6, 0, 0),
(37, 3, 7, 0, 0),
(38, 12, 14, 0, 0),
(39, 22, 1, 0, 0),
(40, 22, 7, 0, 0),
(41, 22, 5, 0, 0),
(42, 22, 9, 0, 0),
(43, 22, 10, 0, 0),
(44, 22, 12, 0, 0),
(45, 22, 13, 0, 0),
(47, 22, 27, 0, 0),
(48, 22, 11, 0, 0),
(49, 3, 8, 0, 0),
(50, 3, 15, 0, 0),
(51, 29, 3, 0, 0),
(52, 3, 30, 0, 0),
(53, 23, 27, 0, 0),
(54, 23, 9, 0, 0),
(55, 12, 31, 0, 0),
(56, 3, 32, 0, 0),
(57, 31, 30, 0, 0),
(58, 12, 19, 0, 0),
(59, 38, 1, 0, 0),
(60, 12, 27, 0, 0),
(61, 12, 26, 0, 0),
(62, 12, 25, 0, 0),
(63, 12, 24, 0, 0),
(64, 12, 23, 0, 0),
(65, 12, 29, 0, 0),
(66, 12, 28, 0, 0),
(67, 12, 20, 0, 0),
(68, 12, 21, 0, 0),
(69, 12, 33, 0, 0),
(70, 12, 34, 0, 0),
(71, 12, 35, 0, 0),
(72, 3, 11, 0, 0),
(73, 12, 36, 0, 0),
(74, 12, 37, 0, 0),
(75, 3, 16, 0, 0),
(76, 3, 34, 0, 0),
(77, 3, 36, 0, 0),
(78, 3, 18, 0, 0),
(79, 3, 10, 0, 0),
(80, 3, 35, 0, 0),
(81, 3, 38, 0, 0),
(82, 3, 13, 0, 0),
(83, 3, 14, 0, 0),
(84, 23, 8, 0, 0),
(85, 38, 11, 0, 0),
(86, 38, 8, 0, 0),
(87, 38, 7, 0, 0),
(88, 38, 12, 0, 0),
(89, 38, 9, 0, 0),
(90, 38, 15, 0, 0),
(91, 38, 13, 0, 0),
(92, 38, 17, 0, 0),
(93, 38, 18, 0, 0),
(94, 38, 19, 0, 0),
(95, 38, 20, 0, 0),
(96, 38, 16, 0, 0),
(97, 38, 21, 0, 0),
(98, 38, 22, 0, 0),
(99, 38, 23, 0, 0),
(100, 40, 12, 0, 0),
(101, 40, 7, 0, 0),
(102, 38, 26, 0, 0),
(103, 38, 29, 0, 0),
(104, 38, 6, 0, 0),
(105, 38, 24, 0, 0),
(106, 40, 9, 0, 0),
(107, 40, 25, 0, 0),
(108, 40, 36, 0, 0),
(109, 40, 3, 0, 0),
(110, 40, 10, 0, 1),
(111, 12, 39, 0, 1),
(112, 41, 3, 0, 2),
(113, 41, 9, 0, 1),
(114, 12, 41, 0, 1),
(115, 27, 24, 0, 1),
(116, 27, 40, 0, 0),
(117, 27, 29, 0, 1),
(118, 27, 19, 0, 1),
(119, 27, 17, 0, 1),
(120, 27, 20, 0, 2),
(121, 42, 3, 0, 1),
(122, 42, 19, 0, 1),
(123, 43, 27, 1, 1),
(124, 44, 18, 0, 1),
(125, 45, 19, 0, 1),
(126, 50, 12, 0, 1);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `normalmessage`
--

CREATE TABLE `normalmessage` (
  `nmid` int(11) NOT NULL,
  `mid` int(11) NOT NULL,
  `text` varchar(4000) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_german2_ci;

--
-- Daten für Tabelle `normalmessage`
--

INSERT INTO `normalmessage` (`nmid`, `mid`, `text`) VALUES
(1772, 882, 'hallo'),
(1773, 883, 'testesttest');

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `statusmessage`
--

CREATE TABLE `statusmessage` (
  `smid` int(11) NOT NULL,
  `mid` int(11) NOT NULL,
  `type` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_german2_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `stmsgpassiveu`
--

CREATE TABLE `stmsgpassiveu` (
  `spuid` int(11) NOT NULL,
  `smid` int(11) NOT NULL,
  `uid` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_german2_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `user`
--

CREATE TABLE `user` (
  `uid` int(11) NOT NULL,
  `username` varchar(30) COLLATE utf8_german2_ci NOT NULL,
  `password` varchar(255) COLLATE utf8_german2_ci NOT NULL,
  `time` datetime NOT NULL,
  `email` varchar(255) COLLATE utf8_german2_ci NOT NULL,
  `isVerified` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_german2_ci;

--
-- Daten für Tabelle `user`
--

INSERT INTO `user` (`uid`, `username`, `password`, `time`, `email`, `isVerified`) VALUES
(1, 'user1', '', '2020-04-07 10:56:24', '', 0),
(3, 'user123', '$2b$10$VETZcpXCh/4Jq1Abo080cu3CWQzMuxjan6hsU2R6v.wJhXXFk0I.C', '0000-00-00 00:00:00', '', 0),
(5, 'user12', '$2b$10$dXzIwFxFXiyzIxvfE9x4gO3HtiBpjOnoLEMXADPmDGsRHZS91ObHy', '0000-00-00 00:00:00', '', 0),
(6, 'uer12', '$2b$10$rUMvkISfrlFE1uZyTxA1IezhiMrGTcTggG.STKRaS055dw9lOoMh2', '2020-04-07 11:15:38', '', 0),
(7, 'uer1254', '$2b$10$qWAhWdrQ9Y1AZstfDUotVO2zGaT7jMtVhb15Aih7s0Sr06W5bLili', '2020-04-07 11:20:33', '', 0),
(8, 'uer12546', '$2b$10$2NUn7P5O2DB0ohSW8AGVruaJ.h65NKQharqXbDYgTbk87Bbt6bqh2', '2020-04-07 11:28:43', '', 0),
(9, 'asdasdads', '$2b$10$ds0K.StFSN6.QLxDtO3f/et2b6KdpW7q6dswaiqmmo96ASWbcjMBe', '2020-04-07 12:07:19', '', 0),
(10, 'asdasdadsas', '$2b$10$AKmprxOOv4FSNeim6X4ciuvc36aWU9vPs7SQIlU5jW99iFTMB8k5q', '2020-04-07 12:07:54', '', 0),
(11, 'asdasdadsasas', '$2b$10$M0F9E6ob/7YE0/sKveGH.OhT5jsXfYDlaCGE.wijV0q1mxAAsSU6u', '2020-04-07 12:09:09', '', 0),
(12, 'stefan', '$2b$10$Dnk3uL27J5nsSTukQsyjIeWwl6qPHGvCPOrMRr6SmpPAvEb0j48SC', '2020-04-07 18:44:19', '', 0),
(13, 'stefan123', '$2b$10$FBIXuf.iV9bAEDsLbgIh/eF/E05dFoJ8kZP0pwz3.OOu1GlAGcrJC', '2020-04-08 11:25:19', '', 0),
(14, 'stefan1234', '$2b$10$5uRT2/Jy8meWBZcrV2yum.y/eVaN7kXiFyvD78L6dJhI62nBpT0HC', '2020-04-08 11:26:12', '', 0),
(15, 'xy1', '$2b$10$Z5DrOtiUSNn9uTpPUQcfQusC50Jidfo/kAI4TB8gqdjcdMySNHuSK', '2020-04-09 20:48:43', '', 0),
(16, 'stefan2', '$2b$10$nitZREJc2F.uVHhzUtTmv.433Sbvg21Ae8pFaUCIso3/8xxUSzu7y', '2020-04-09 20:51:55', '', 0),
(17, 'test_1', '$2b$10$S2JXdVcoAlw0rGiIFRdPzeOCnh2/z2TYth/l3i0GUg0vwf/0drrzu', '2020-04-22 18:15:10', '', 0),
(18, '_test_3', '$2b$10$wWmKpyA3uXGR9BcDdC5/0uak4HXB5MkFct5TbrdRvkKdf/PVh7hP.', '2020-04-30 14:38:34', '', 0),
(19, '_test_1', '$2b$10$2wYKBOBdU2pMmJ/lYgAVy.25cgpwpLlkHipDUFA4xePu6kTpemEu2', '2020-04-30 14:39:28', '', 0),
(20, '_test_2', '$2b$10$BsERZ9v2w7OJt0PRGBAsAezTmNQmMD1/rDFAowqJCH1xuYMA4N0eG', '2020-04-30 14:42:10', '', 0),
(21, '_test_4', '$2b$10$VgyLClmw8JGHgENFG2QOwegPEMkTV58a43moF3J/96bdYzTxspLY2', '2020-05-15 11:50:22', '', 0),
(22, '_test_5', '$2b$10$8aOebJiCMi498ZwNR/2NMu4UZdc9i3UDmhD0/725w45LPzNPxLjqO', '2020-05-15 11:52:56', '', 0),
(23, '_test_6', '$2b$10$LJ6qPfKvhiGrrMsp6yPnQuiyqCWosxigpqRpMC0jvyFaJaU00lMqC', '2020-05-15 11:55:59', '', 0),
(24, '_test_7', '$2b$10$kh3BJYG97W5bBuHVnhSYcesXYczY60UocI/d70ed.G/vqNfPtOU9W', '2020-05-15 14:49:27', '', 0),
(25, '_test_8', '$2b$10$gpeYvKATgKkduAh2u5NaFO3M9nvd4J8B00VlTokKhj0qc9XQGaY3C', '2020-05-15 14:50:28', '', 0),
(26, '_test_9', '$2b$10$yTO7UUBTUfSChjVY7eftI.orsE.jvLUFUHzSOzCal4J5Dg2in6jIq', '2020-05-15 14:52:47', '', 0),
(27, '_test_10', '$2b$10$eiKleH5DsazgFjS8/Ax2sux46PK.K/Ec61KCFtreztv16S0CTL1g2', '2020-05-15 14:56:14', '', 0),
(28, '_test_11', '$2b$10$naLWwDB8fM19fdQX/8wspe2ZU10vphcSJ29qtY.drPwaS8bVoZHU6', '2020-05-15 14:59:05', '', 0),
(29, '_test_12', '$2b$10$m/YbM2VTN30eDqhS3KvVNeZjdaV7UtRifuWp/OSGDNU3eFjU7ePHC', '2020-05-15 18:18:22', '', 0),
(30, 'sfsss', '$2b$10$KDRrIrF4kv4cWX6PF7RLs.aynjrihNeaoqDP/2z2YdtxfsySfZPBO', '2020-05-16 14:23:16', '', 0),
(31, 'sdfsdf', '$2b$10$WNWfOTVZJY3exNamIsjPfe7vy7nUSvCOCNpzy79fY1S7U7da7YZ3W', '2020-05-24 21:08:19', '', 0),
(32, 'test123', '$2b$10$GDIVZnM9uuKhjJXlvPLj0.X5Xeb.4MDmqI7PUzq0WeJHv0xrKEXpW', '2020-05-24 21:11:38', '', 0),
(33, 'xy12', '$2b$10$zcHnVOEDqmt7yVLCNqZ3eOed8rKE5QYY6PnjmME9KKs50fe80PvWK', '2020-05-24 21:16:01', '', 0),
(34, '_test_14', '$2b$10$xHRZHbHGSnbMzq45NVj5z.iNvGqR87dwTVeNBGZhxz5glQDNy9w/2', '2020-05-28 18:05:01', '', 0),
(35, '_test_15', '$2b$10$6hC7OT.Fdz/IPq7uy/jh3usqxZ9/mmCe.C5au3NcNbUIuAUg0ozDm', '2020-05-28 18:08:11', '', 0),
(36, '_test_16', '$2b$10$SL6K.enxH0nk2d8nL7MZZOv9YrZklx./NT91hTHXVz1u7XDELDoXu', '2020-05-29 09:24:34', '', 0),
(37, '_test_17', '$2b$10$U/QFLxcrlxJ/KopXT46mgO7RcSgUg4IhXiAyMw3ICjTXcHb3ChX/W', '2020-05-29 09:27:54', '', 0),
(38, '_test_18', '$2b$10$svi5XibipmYF64F3d5v0Ke1A0lwr1gucZpqVVMLg5NIVPUHaPiGQS', '2020-05-29 09:30:53', '', 0),
(39, '_test_19', '$2b$10$cDQWm6LdIQ6jIjVCzGKeWevWAt8.n7.5KWq5JwqKzIJxY2fpyf.ka', '2020-05-29 09:46:26', '', 0),
(40, '_test_22', '$2b$10$PKJ8ucU9GepkfNmkTwbI.uXr.UBWA67kvsqnfFdy1MsMt12M7qtYq', '2020-06-11 20:19:17', '', 0),
(41, 'test_23', '$2b$10$/eotF6lYMKfD6IHoJUvafu1P2KUlZ2tZvpVhzt1tuXK5aiztfVItW', '2020-06-25 19:57:58', '', 0),
(42, '_test_24', '$2b$10$PUkOVNJjNvbhsYC19esq3.QyakEM/AZLxturyjujsyujJ0ERzA.76', '2020-07-01 16:26:23', '', 0),
(43, '_test_25', '$2b$10$10wtKpEI.TAn4nNwwwHWO.r11XqxjbN.yatzcqWUE24hD7Z8xHA5y', '2020-07-01 16:28:01', '', 0),
(44, '_test_26', '$2b$10$sBvTMZwvWezrWba3SvJGxe8aFlOTQGQL5KjNaw2oGE7rFBnu6Y6BG', '2020-07-01 16:34:03', '', 0),
(45, '_test_27', '$2b$10$tE2uLf3HI4pi9/sgLHmF2.Ij1isPhUz6l.iWd.aMov7uFcPsBYryK', '2020-07-01 16:37:48', '', 0),
(46, '_test_28', '$2b$10$K3y1Ux6HNjTZ1TAkVAuZHucFI/EFwlSvn.nrk00CAGZoSmQy369H2', '2020-07-01 16:38:23', '', 0),
(47, 'test123456', '$2b$10$i0J/YQUjA0tRFao9Ku57luYWznYRMbtwG9XgTBpK2duRfuMIFVJRC', '2020-09-21 19:31:51', 'stefanjkf.test@gmail.com', 1),
(48, 'test234567', '$2b$10$X01tLiiDIx5PA3cpCcowuOZ5JwJxXqmIjzFW7UzVjztLSko.hTiMG', '2020-09-23 21:22:37', '', 0),
(49, 'test345678', '$2b$10$.ARUcgJSRka/maOgZgHrWuinZD0o8FTw7BCNLq9BrIN/MToiSxnBW', '2020-09-23 21:32:44', 'stefanjkf.test@gmail.com', 1),
(50, 'teste', '$2b$10$.pSTfC.MWC/PH8qxGMefBeENGaWzw2px1ujvXu4CFViuscKFRf6Q6', '2020-10-01 21:40:18', '', 0);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `verificationcode`
--

CREATE TABLE `verificationcode` (
  `vcid` int(11) NOT NULL,
  `uid` int(11) NOT NULL,
  `type` int(11) NOT NULL,
  `hash` varchar(255) NOT NULL,
  `date` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Daten für Tabelle `verificationcode`
--

INSERT INTO `verificationcode` (`vcid`, `uid`, `type`, `hash`, `date`) VALUES
(16, 12, 0, '$2b$10$NaxuVZkQ9Xby1OYRHKN19uC5UXE8AinNFsStXvDccBJ2pCR0sW9wG', '0000-00-00 00:00:00'),
(554, 49, 0, '$2b$10$rMO8ZgxBP9yiWwbD75r4Y.55WbJhUftzvX7O4Wii4OtNoF30Je1Gu', '2020-12-13 15:59:53'),
(555, 49, 1, '$2b$10$UjYjWXQSQY6yqM8eP7bDCO6NaOhltUyuxz8z2i6yZhOwYfn.j.uHm', '2020-12-13 15:59:55'),
(557, 47, 0, '$2b$10$x1vmKIVTa/FCAmX1N3aqCuhvZwSYj.BCiikz5nCDIWzDFEkYDCove', '2020-12-13 15:59:58');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `blockedusers`
--
ALTER TABLE `blockedusers`
    ADD PRIMARY KEY (`buid`);

--
-- Indizes für die Tabelle `emailchange`
--
ALTER TABLE `emailchange`
    ADD PRIMARY KEY (`ecid`);

--
-- Indizes für die Tabelle `groupchat`
--
ALTER TABLE `groupchat`
    ADD PRIMARY KEY (`gcid`);

--
-- Indizes für die Tabelle `groupchatmember`
--
ALTER TABLE `groupchatmember`
    ADD PRIMARY KEY (`gcmid`);

--
-- Indizes für die Tabelle `media`
--
ALTER TABLE `media`
    ADD PRIMARY KEY (`meid`);

--
-- Indizes für die Tabelle `mentioneduser`
--
ALTER TABLE `mentioneduser`
    ADD PRIMARY KEY (`muid`);

--
-- Indizes für die Tabelle `message`
--
ALTER TABLE `message`
    ADD PRIMARY KEY (`mid`);

--
-- Indizes für die Tabelle `normalchat`
--
ALTER TABLE `normalchat`
    ADD PRIMARY KEY (`ncid`);

--
-- Indizes für die Tabelle `normalmessage`
--
ALTER TABLE `normalmessage`
    ADD PRIMARY KEY (`nmid`);

--
-- Indizes für die Tabelle `statusmessage`
--
ALTER TABLE `statusmessage`
    ADD PRIMARY KEY (`smid`);

--
-- Indizes für die Tabelle `stmsgpassiveu`
--
ALTER TABLE `stmsgpassiveu`
    ADD PRIMARY KEY (`spuid`);

--
-- Indizes für die Tabelle `user`
--
ALTER TABLE `user`
    ADD PRIMARY KEY (`uid`);

--
-- Indizes für die Tabelle `verificationcode`
--
ALTER TABLE `verificationcode`
    ADD PRIMARY KEY (`vcid`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `blockedusers`
--
ALTER TABLE `blockedusers`
    MODIFY `buid` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `emailchange`
--
ALTER TABLE `emailchange`
    MODIFY `ecid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=432;

--
-- AUTO_INCREMENT für Tabelle `groupchat`
--
ALTER TABLE `groupchat`
    MODIFY `gcid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT für Tabelle `groupchatmember`
--
ALTER TABLE `groupchatmember`
    MODIFY `gcmid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=327;

--
-- AUTO_INCREMENT für Tabelle `media`
--
ALTER TABLE `media`
    MODIFY `meid` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `mentioneduser`
--
ALTER TABLE `mentioneduser`
    MODIFY `muid` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `message`
--
ALTER TABLE `message`
    MODIFY `mid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=882;

--
-- AUTO_INCREMENT für Tabelle `normalchat`
--
ALTER TABLE `normalchat`
    MODIFY `ncid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=127;

--
-- AUTO_INCREMENT für Tabelle `normalmessage`
--
ALTER TABLE `normalmessage`
    MODIFY `nmid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1772;

--
-- AUTO_INCREMENT für Tabelle `statusmessage`
--
ALTER TABLE `statusmessage`
    MODIFY `smid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=89;

--
-- AUTO_INCREMENT für Tabelle `stmsgpassiveu`
--
ALTER TABLE `stmsgpassiveu`
    MODIFY `spuid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=137;

--
-- AUTO_INCREMENT für Tabelle `user`
--
ALTER TABLE `user`
    MODIFY `uid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT für Tabelle `verificationcode`
--
ALTER TABLE `verificationcode`
    MODIFY `vcid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=558;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
