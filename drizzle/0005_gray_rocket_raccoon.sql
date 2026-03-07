CREATE TABLE `collections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` varchar(32) NOT NULL,
	`photoUrl` text,
	`ocrText` text,
	`matchScore` decimal(5,2),
	`prefecture` varchar(16) NOT NULL,
	`region` varchar(32) NOT NULL,
	`pointsEarned` int NOT NULL DEFAULT 0,
	`status` enum('pending','matched','unmatched','manual') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `collections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `collectorStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalCollected` int NOT NULL DEFAULT 0,
	`prefecturesCount` int NOT NULL DEFAULT 0,
	`regionsCount` int NOT NULL DEFAULT 0,
	`collectorRank` enum('traveler','seasoned','master','legend') NOT NULL DEFAULT 'traveler',
	`stampedPrefectures` text,
	`stampedRegions` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `collectorStats_id` PRIMARY KEY(`id`),
	CONSTRAINT `collectorStats_userId_unique` UNIQUE(`userId`)
);
