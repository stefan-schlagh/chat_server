-- phpMyAdmin SQL Dump
-- version 4.9.0.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Erstellungszeit: 02. Jul 2020 um 10:24
-- Server-Version: 10.4.6-MariaDB
-- PHP-Version: 7.1.32

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
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
-- Tabellenstruktur für Tabelle `groupchat`
--

CREATE TABLE `groupchat` (
  `gcid` int(11) NOT NULL,
  `name` varchar(255) COLLATE utf8_german2_ci NOT NULL,
  `description` varchar(4000) COLLATE utf8_german2_ci NOT NULL,
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
  `unreadMessages` int(11) NOT NULL,
  `isStillMember` tinyint(4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_german2_ci;

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
  `content` varchar(4000) COLLATE utf8mb4_bin NOT NULL,
  `date` datetime NOT NULL,
  `isGroupChat` tinyint(1) NOT NULL,
  `messageType` int(11) NOT NULL,
  `cid` int(11) NOT NULL,
  `uid` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `normalchat`
--

CREATE TABLE `normalchat` (
  `ncid` int(11) NOT NULL,
  `uid1` int(11) NOT NULL,
  `uid2` int(11) NOT NULL,
  `unreadMessages1` int(11) NOT NULL,
  `unreadMessages2` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_german2_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `normalmessage`
--

CREATE TABLE `normalmessage` (
  `nmid` int(11) NOT NULL,
  `mid` int(11) NOT NULL,
  `text` varchar(4000) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_german2_ci;

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
  `time` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_german2_ci;

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `blockedusers`
--
ALTER TABLE `blockedusers`
  ADD PRIMARY KEY (`buid`);

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
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `blockedusers`
--
ALTER TABLE `blockedusers`
  MODIFY `buid` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `groupchat`
--
ALTER TABLE `groupchat`
  MODIFY `gcid` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `groupchatmember`
--
ALTER TABLE `groupchatmember`
  MODIFY `gcmid` int(11) NOT NULL AUTO_INCREMENT;

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
  MODIFY `mid` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `normalchat`
--
ALTER TABLE `normalchat`
  MODIFY `ncid` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `normalmessage`
--
ALTER TABLE `normalmessage`
  MODIFY `nmid` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `statusmessage`
--
ALTER TABLE `statusmessage`
  MODIFY `smid` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `stmsgpassiveu`
--
ALTER TABLE `stmsgpassiveu`
  MODIFY `spuid` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `user`
--
ALTER TABLE `user`
  MODIFY `uid` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
