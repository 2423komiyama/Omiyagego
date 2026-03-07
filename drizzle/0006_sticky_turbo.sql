ALTER TABLE `users` ADD `nickname` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `homePrefecture` varchar(16);--> statement-breakpoint
ALTER TABLE `users` ADD `isProfileComplete` boolean DEFAULT false NOT NULL;