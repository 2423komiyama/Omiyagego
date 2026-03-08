ALTER TABLE `products` ADD `realImageUrl` text;--> statement-breakpoint
ALTER TABLE `products` ADD `imageSource` varchar(256);--> statement-breakpoint
ALTER TABLE `products` ADD `reasonsToChoose` text;--> statement-breakpoint
ALTER TABLE `products` ADD `guaranteeDetail` text;--> statement-breakpoint
ALTER TABLE `products` ADD `makerName` varchar(128);--> statement-breakpoint
ALTER TABLE `products` ADD `makerFoundedYear` int;--> statement-breakpoint
ALTER TABLE `products` ADD `makerAddress` varchar(256);--> statement-breakpoint
ALTER TABLE `products` ADD `makerPhone` varchar(32);--> statement-breakpoint
ALTER TABLE `products` ADD `productSpecs` text;--> statement-breakpoint
ALTER TABLE `products` ADD `buzzTopics` text;