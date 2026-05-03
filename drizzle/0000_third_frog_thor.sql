CREATE TABLE `bikes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(255) NOT NULL,
	`maker` text(255) NOT NULL,
	`category` text NOT NULL,
	`cylinders` text(10) NOT NULL,
	`transmission` text NOT NULL,
	`horsepower` integer NOT NULL,
	`fuelEfficiency` integer NOT NULL,
	`weight` integer NOT NULL,
	`seatHeight` integer NOT NULL,
	`totalLength` integer NOT NULL,
	`year` integer NOT NULL,
	`price` integer NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `decks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gameId` integer NOT NULL,
	`category` text NOT NULL,
	`bikeIds` text NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `gameStates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gameId` integer NOT NULL,
	`playerId` integer NOT NULL,
	`hand` text NOT NULL,
	`passed` integer DEFAULT 0 NOT NULL,
	`rank` integer,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`playerCount` integer NOT NULL,
	`status` text DEFAULT 'playing' NOT NULL,
	`currentRound` integer DEFAULT 1 NOT NULL,
	`currentTurn` integer DEFAULT 1 NOT NULL,
	`declarationPlayer` integer,
	`declaredSpec` text(50),
	`declaredDirection` text(10),
	`currentBind` text(50),
	`bindValue` text(255),
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `likes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `playedCards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gameId` integer NOT NULL,
	`playerId` integer NOT NULL,
	`bikeIds` text NOT NULL,
	`playedAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `roundHistory` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gameId` integer NOT NULL,
	`round` integer NOT NULL,
	`declarationPlayer` integer NOT NULL,
	`condition` text(50) NOT NULL,
	`direction` text NOT NULL,
	`bindType` text(50),
	`bindValue` text(255),
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text(64) NOT NULL,
	`name` text,
	`email` text(320),
	`loginMethod` text(64),
	`role` text DEFAULT 'user' NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`lastSignedIn` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);