PRAGMA foreign_keys=OFF;--> statement-breakpoint
-- Step 1: Add the limits column to the existing table
ALTER TABLE `plans` ADD `limits` text NOT NULL DEFAULT '{}';
--> statement-breakpoint
-- Step 2: Migrate existing max_properties data into limits column
UPDATE `plans` SET `limits` = json_object('properties', `max_properties`) WHERE `limits` = '{}';
--> statement-breakpoint
-- Step 3: Recreate the table with the new schema
CREATE TABLE `__new_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`price` integer NOT NULL,
	`features` text NOT NULL,
	`limits` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_plans` SELECT `id`, `product_id`, `name`, `slug`, `price`, `features`, `limits`, `is_active`, `created_at` FROM `plans`;
--> statement-breakpoint
DROP TABLE `plans`;
--> statement-breakpoint
ALTER TABLE `__new_plans` RENAME TO `plans`;
--> statement-breakpoint
CREATE UNIQUE INDEX `plans_slug_unique` ON `plans` (`slug`);