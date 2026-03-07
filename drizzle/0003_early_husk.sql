CREATE TABLE `features` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(128) NOT NULL,
	`subtitle` varchar(256),
	`imageUrl` text,
	`linkUrl` varchar(512) NOT NULL,
	`linkType` enum('station','purpose','region','article','external') DEFAULT 'article',
	`badgeText` varchar(32),
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`startsAt` timestamp,
	`endsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `features_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` varchar(32) NOT NULL,
	`userId` int,
	`sessionId` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` varchar(32) NOT NULL,
	`userId` int,
	`authorName` varchar(64),
	`rating` tinyint NOT NULL,
	`purposeTag` varchar(64),
	`body` text NOT NULL,
	`isAnonymous` boolean NOT NULL DEFAULT false,
	`isVisible` boolean NOT NULL DEFAULT true,
	`reportCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `products` ADD `purposeTags` text;--> statement-breakpoint
ALTER TABLE `products` ADD `minPeople` int;--> statement-breakpoint
ALTER TABLE `products` ADD `maxPeople` int;--> statement-breakpoint
ALTER TABLE `products` ADD `editorialPick` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `editorialNote` text;--> statement-breakpoint
ALTER TABLE `products` ADD `externalLinks` text;--> statement-breakpoint
ALTER TABLE `products` ADD `likeCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `sellers` ADD `mapUrl` text;--> statement-breakpoint
ALTER TABLE `sellers` ADD `walkMinutes` int;--> statement-breakpoint
ALTER TABLE `sellers` ADD `topProductIds` text;