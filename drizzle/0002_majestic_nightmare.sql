CREATE TABLE `fixtures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fixtureDate` varchar(10) NOT NULL,
	`fixtureTime` varchar(5) NOT NULL,
	`team` varchar(40) NOT NULL,
	`opponent` varchar(160) NOT NULL,
	`venue` varchar(80) NOT NULL,
	`competition` varchar(120) NOT NULL,
	`status` enum('Upcoming','FT','Postponed') NOT NULL DEFAULT 'Upcoming',
	`score` varchar(20),
	`scorers` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fixtures_id` PRIMARY KEY(`id`)
);
