CREATE TABLE `curatedLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` varchar(32) NOT NULL,
	`type` enum('youtube','instagram','twitter','tiktok','article','news','other') NOT NULL,
	`url` text NOT NULL,
	`title` varchar(256),
	`thumbnailUrl` text,
	`description` text,
	`authorName` varchar(128),
	`publishedAt` timestamp,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`addedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `curatedLinks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pointTransactions` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('earn_review','earn_like','earn_login','earn_bonus','earn_admin','use_coupon','use_exchange','expire') NOT NULL,
	`points` int NOT NULL,
	`balanceAfter` int NOT NULL,
	`referenceType` varchar(32),
	`referenceId` varchar(64),
	`description` varchar(256),
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pointTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userBadges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`badgeType` enum('first_review','review_5','review_20','like_10','like_50','first_login','login_10','explorer','gourmet') NOT NULL,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	`rewardClaimed` boolean NOT NULL DEFAULT false,
	`rewardClaimedAt` timestamp,
	CONSTRAINT `userBadges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userPoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalPoints` int NOT NULL DEFAULT 0,
	`availablePoints` int NOT NULL DEFAULT 0,
	`usedPoints` int NOT NULL DEFAULT 0,
	`expiredPoints` int NOT NULL DEFAULT 0,
	`tier` enum('bronze','silver','gold','platinum') NOT NULL DEFAULT 'bronze',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userPoints_id` PRIMARY KEY(`id`),
	CONSTRAINT `userPoints_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `reviews` MODIFY COLUMN `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `reviewCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `avgRating` decimal(3,2);--> statement-breakpoint
ALTER TABLE `reviews` ADD `likeCount` int DEFAULT 0 NOT NULL;