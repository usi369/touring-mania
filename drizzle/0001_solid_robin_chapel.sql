ALTER TABLE `bikes` ADD `isTokyoRemake` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `bikes` ADD `isR6Complete` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `bikes` ADD `isR7Mega` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `bikes` ADD `isR7Starter` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `games` ADD `edition` text(50) DEFAULT 'r7_starter' NOT NULL;