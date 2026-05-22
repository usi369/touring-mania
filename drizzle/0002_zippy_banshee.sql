CREATE TABLE `otps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text(320) NOT NULL,
	`code` text(4) NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
