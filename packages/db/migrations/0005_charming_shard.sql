CREATE TABLE `payment_methods` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`provider` text,
	`config` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_methods_slug_unique` ON `payment_methods` (`slug`);--> statement-breakpoint
CREATE TABLE `product_payment_methods` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`payment_method_id` text NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `payment_method_id` text REFERENCES payment_methods(id);