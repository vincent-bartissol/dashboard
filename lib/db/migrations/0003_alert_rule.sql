CREATE TABLE `alert_rule` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`dataset_id` text NOT NULL,
	`record_id` text NOT NULL,
	`label` text NOT NULL,
	`metric` text DEFAULT 'bikes_below' NOT NULL,
	`threshold` integer NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`last_triggered_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `alert_rule_user_dataset_record_metric` ON `alert_rule` (`user_id`,`dataset_id`,`record_id`,`metric`);
--> statement-breakpoint
CREATE INDEX `alert_rule_user_idx` ON `alert_rule` (`user_id`);
--> statement-breakpoint
CREATE INDEX `alert_rule_enabled_idx` ON `alert_rule` (`enabled`);
