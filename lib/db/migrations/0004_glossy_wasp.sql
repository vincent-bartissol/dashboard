CREATE TABLE `contact_message` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`message` text NOT NULL,
	`locale` text NOT NULL,
	`email_sent` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `contact_message_created_idx` ON `contact_message` (`created_at`);
