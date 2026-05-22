PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_otps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text(320) NOT NULL,
	`code` text(10) NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_otps`("id", "email", "code", "attempts", "expiresAt", "createdAt") SELECT "id", "email", "code", "attempts", "expiresAt", "createdAt" FROM `otps`;--> statement-breakpoint
DROP TABLE `otps`;--> statement-breakpoint
ALTER TABLE `__new_otps` RENAME TO `otps`;--> statement-breakpoint
PRAGMA foreign_keys=ON;