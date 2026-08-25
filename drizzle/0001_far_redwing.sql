CREATE TABLE `seniorPlayers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`season` varchar(20) NOT NULL,
	`playerName` varchar(160) NOT NULL,
	`position` varchar(60) NOT NULL,
	`imageKey` varchar(512) NOT NULL,
	`imageUrl` varchar(512) NOT NULL,
	`displayOrder` int NOT NULL DEFAULT 0,
	`isPublished` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `seniorPlayers_id` PRIMARY KEY(`id`)
);
