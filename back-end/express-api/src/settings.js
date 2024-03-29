/* eslint-disable prefer-destructuring */
import dotenv from 'dotenv';

require('events').EventEmitter.defaultMaxListeners = 15;

dotenv.config();

export const DB_USER = process.env.DO_DB_USER;
export const DB_PWD = process.env.DO_DB_PASSWORD;
export const DB_HOST = process.env.DO_DB_HOST;
export const DB_DB = process.env.DO_DATABASE;
export const DB_PORT = process.env.DO_DB_PORT;
export const PATREON_CLIENT_SECRET = process.env.PATREON_CLIENT_SECRET;
export const PATREON_CLIENT_ID = process.env.PATREON_CLIENT_ID;
export const PATREON_REDIRECT_URL = 'https://dynasty-daddy.com';

// local values to database
// export const DB_USER = 'postgres';
// export const DB_PWD = 'postgres';
// export const DB_HOST = 'localhost';
// export const DB_DB = 'dynasty_daddy';
// export const DB_PORT = 5432;
// export const PATREON_CLIENT_SECRET = '';
// export const PATREON_CLIENT_ID = '';
// export const PATREON_REDIRECT_URL = 'http://localhost:4200/';

// hardcoded league format tool since the year ends, fantasy season year,
// and player experience don't line up. It's easiest to just toggle this
// once the rookies have been added for the previous year and the old rookies
// experience goes from 0 to 1.
export const LEAGUE_FORMAT_TOOL_DATE = 2023;

// dynasty daddy patreon tier to verify on
export const PATREON_TIER_ID = '7092280';
