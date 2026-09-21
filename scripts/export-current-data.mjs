import mysql from 'mysql2/promise';
import fs from 'node:fs/promises';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [seniorPlayers] = await connection.query('select season, playerName, position, imageKey, imageUrl, displayOrder, isPublished from seniorPlayers order by id');
const [fixtures] = await connection.query('select fixtureDate, fixtureTime, team, opponent, venue, competition, status, score, scorers from fixtures order by fixtureDate, fixtureTime, id');
await connection.end();
await fs.writeFile('/tmp/santos-soka-current-data.json', JSON.stringify({ seniorPlayers, fixtures }, null, 2));
console.log(JSON.stringify({ seniorPlayers: seniorPlayers.length, fixtures: fixtures.length }));
