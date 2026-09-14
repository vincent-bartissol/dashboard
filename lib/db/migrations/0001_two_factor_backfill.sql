UPDATE `user` SET `two_factor_enabled` = 1 WHERE `two_factor_enabled` = 0;
--> statement-breakpoint
INSERT INTO `two_factor` (`id`, `user_id`, `secret`, `backup_codes`, `verified`, `failed_verification_count`)
SELECT lower(hex(randomblob(16))), `id`, '', '[]', 0, 0
FROM `user`
WHERE `id` NOT IN (SELECT `user_id` FROM `two_factor`);
