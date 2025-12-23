PRAGMA foreign_keys=OFF;-->statement-breakpoint
-- IMPORTANT: Migrate existing max_properties to JSON format BEFORE table recreation
-- This UPDATE runs on the old table before it's dropped
UPDATE `plans` SET `limits` = json_object('properties', `max_properties`) WHERE `limits` IS NULL OR `limits` = '';-->statement-breakpoint
CREATE TABLE `__new_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`price` integer NOT NULL,
	`features` text NOT NULL,
	`limits` text NOT NULL,
	`max_properties` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);-->statement-breakpoint
-- COALESCE ensures limits is set from max_properties if somehow still NULL
INSERT INTO `__new_plans`("id", "product_id", "name", "slug", "price", "features", "limits", "max_properties", "is_active", "created_at") SELECT "id", "product_id", "name", "slug", "price", "features", COALESCE("limits", json_object('properties', "max_properties")), "max_properties", "is_active", "created_at" FROM `plans`;-->statement-breakpoint
DROP TABLE `plans`;-->statement-breakpoint
ALTER TABLE `__new_plans` RENAME TO `plans`;-->statement-breakpoint
PRAGMA foreign_keys=ON;-->statement-breakpoint
CREATE UNIQUE INDEX `plans_slug_unique` ON `plans` (`slug`);