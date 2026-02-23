CREATE TABLE `facilities` (
	`id` varchar(32) NOT NULL,
	`name` varchar(128) NOT NULL,
	`shortLabel` varchar(32) NOT NULL,
	`region` varchar(32) NOT NULL,
	`prefecture` varchar(16) NOT NULL,
	`latitude` decimal(10,8) NOT NULL,
	`longitude` decimal(11,8) NOT NULL,
	`insideGate` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `facilities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `giftMessages` (
	`id` varchar(32) NOT NULL,
	`productId` varchar(32) NOT NULL,
	`title` varchar(128) NOT NULL,
	`message` text NOT NULL,
	`occasion` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `giftMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` varchar(32) NOT NULL,
	`name` varchar(256) NOT NULL,
	`brand` varchar(128) NOT NULL,
	`description` text,
	`price` int NOT NULL,
	`imageUrl` text,
	`prefecture` varchar(16) NOT NULL,
	`region` varchar(32) NOT NULL,
	`category` varchar(64) NOT NULL,
	`shelfLife` int,
	`isIndividualPackaged` boolean NOT NULL DEFAULT false,
	`servingSize` int,
	`guaranteeReason` text,
	`makerStory` text,
	`badges` varchar(256),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reservations` (
	`id` varchar(32) NOT NULL,
	`productId` varchar(32) NOT NULL,
	`facilityId` varchar(32) NOT NULL,
	`recipientName` varchar(128) NOT NULL,
	`quantity` int NOT NULL,
	`pickupDate` timestamp NOT NULL,
	`reservationNumber` varchar(32) NOT NULL,
	`status` enum('pending','confirmed','picked_up','cancelled') DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reservations_id` PRIMARY KEY(`id`),
	CONSTRAINT `reservations_reservationNumber_unique` UNIQUE(`reservationNumber`)
);
--> statement-breakpoint
CREATE TABLE `sellers` (
	`id` varchar(32) NOT NULL,
	`productId` varchar(32) NOT NULL,
	`facilityId` varchar(32) NOT NULL,
	`storeName` varchar(128) NOT NULL,
	`floor` varchar(32),
	`location` varchar(256),
	`insideGate` boolean NOT NULL DEFAULT false,
	`businessHours` varchar(256),
	`congestionLevel` enum('low','medium','high') DEFAULT 'medium',
	`stockStatus` enum('in_stock','low_stock','out_of_stock') DEFAULT 'in_stock',
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sellers_id` PRIMARY KEY(`id`)
);
