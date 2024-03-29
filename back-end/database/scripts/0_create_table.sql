CREATE USER docker;

CREATE DATABASE docker;

GRANT ALL PRIVILEGES ON DATABASE docker TO docker;

-- create player values table
create table player_values (
    id serial not null,
    name_id varchar(30),
    sf_position_rank int,
    position_rank int,
    sf_trade_value int,
    trade_value int,
    fc_sf_trade_value int,
    fc_trade_value int,
    fc_sf_position_rank int,
    fc_position_rank int,
    dp_sf_trade_value int,
    dp_trade_value int,
    dp_sf_position_rank int,
    dp_position_rank int,
    ds_sf_trade_value int,
    ds_trade_value int,
    ds_sf_position_rank int,
    ds_position_rank int,
    ktc_rd_sf_trade_value int,
    ktc_rd_trade_value int,
    ktc_rd_sf_position_rank int,
    ktc_rd_position_rank int,
    fc_rd_sf_trade_value int,
    fc_rd_trade_value int,
    fc_rd_sf_position_rank int,
    fc_rd_position_rank int,
    created_at timestamp not null default CURRENT_TIMESTAMP
);

create unique index player_values_id_uindex on player_values (id);

alter table
    player_values
add
    constraint player_values_pk primary key (id);

-- create player info table for player details
create table player_info (
    id serial primary key not null,
    name_id varchar(30) not null unique,
    full_name varchar(50),
    first_name varchar(30),
    last_name varchar(30),
    team varchar(3),
    position varchar(2),
    age int,
    experience int,
    college varchar(50),
    injury_status varchar(25),
    weight int,
    height varchar(8),
    jersey_number int,
    active boolean,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

create unique index player_info_id_uindex on player_info (name_id);

-- create player ids table
create table player_ids (
    id serial primary key not null,
    name_id varchar(30) not null unique,
    sleeper_id varchar(30),
    mfl_id varchar(10),
    ff_id varchar(10),
    espn_id varchar(10),
    yahoo_id varchar(10),
    ffpc_id varchar(10),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

create unique index player_ids_id_uindex on player_ids (id);

-- create config table
create table config (
    config_key text not null primary key,
    config_value text not null,
    description text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    is_internal_only BOOLEAN DEFAULT false
);

-- add active default values
ALTER TABLE
    player_info
ALTER COLUMN
    active
SET
    DEFAULT true;

-- create player ADP table
CREATE TABLE player_adp (
    name_id varchar(30) UNIQUE,
    fantasyPro_adp int,
    bb10_adp int,
    rtsports_adp int,
    underdog_adp int,
    drafters_adp int,
    avg_adp decimal,
    espn_ros int,
    fantasyguys_ros int,
    numberfire_ros int,
    avg_ros decimal,
    updated_at timestamp not null default CURRENT_TIMESTAMP,
    created_at timestamp not null default CURRENT_TIMESTAMP
);

-- create updated_at trigger
CREATE
OR REPLACE FUNCTION trigger_get_current_timestamp () RETURNS trigger AS $ $ BEGIN NEW.updated_at = NOW();

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

-- create player metadata table
create table player_metadata (
    name_id varchar(30) primary key not null unique,
    profile_json jsonb,
    contract_json jsonb,
    ras_json jsonb,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

create unique index player_metadata_id_uindex on player_metadata (name_id);

-- add trigger to player metadata table
CREATE TRIGGER player_metadata_updated_at BEFORE
UPDATE
    ON player_metadata FOR EACH ROW EXECUTE PROCEDURE trigger_get_current_timestamp();

-- add trigger to player adp table
CREATE TRIGGER player_adp_updated_at BEFORE
UPDATE
    ON player_adp FOR EACH ROW EXECUTE PROCEDURE trigger_get_current_timestamp();

-- add trigger to player ids table
CREATE TRIGGER player_ids_updated_at BEFORE
UPDATE
    ON player_ids FOR EACH ROW EXECUTE PROCEDURE trigger_get_current_timestamp();

-- add trigger to player info table
CREATE TRIGGER player_info_updated_at BEFORE
UPDATE
    ON player_info FOR EACH ROW EXECUTE PROCEDURE trigger_get_current_timestamp();

-- player gamelogs table
CREATE TABLE player_gamelogs (
  season INTEGER NOT NULL,
  week INTEGER NOT NULL,
  gamelog_json jsonb,
  PRIMARY KEY (season, week)
);

-- player grid for NFL gridiron data
CREATE TABLE player_grid (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    jersey_numbers TEXT[],
    teams TEXT[],
    headshot_url VARCHAR(255),
    pos VARCHAR(5),
    college VARCHAR(100),
    sleeper_id VARCHAR(10),
    awards_json jsonb,
    start_date VARCHAR(5),
    end_date VARCHAR(5),
    stats_json jsonb,
    gsis_id VARCHAR(10),
    pfr_id varchar(10),
    search_name TEXT,
    rookie_year VARCHAR(5),
    draft_pick INT,
    draft_club VARCHAR(4),
    played_with VARCHAR[];
);

create index player_grid_uindex on player_grid (name);
create index player_grid_search_uindex on player_grid (search_name);

CREATE OR REPLACE FUNCTION update_search_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_name := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9 ]+', '', 'g'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_search_name_trigger
BEFORE INSERT OR UPDATE ON player_grid
FOR EACH ROW
EXECUTE FUNCTION update_search_name();

ALTER TABLE player_grid ENABLE TRIGGER update_search_name_trigger;

UPDATE player_grid SET name = name;


-- historical gridirons table
create table historical_gridirons (
	id Serial primary key, 
	daily_grid text not null,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

create index historical_gridirons_uindex on historical_gridirons (id);

-- grid results table
create table grid_results (
    player_id Serial primary KEY
    cellnum INTEGER,
    name text,
    guesses INTEGER,
    img text,
    grid_id INTEGER,
)

create index grid_results_uindex on grid_results (grid_id);

ALTER TABLE grid_results
ADD CONSTRAINT unique_player_cell_grid
UNIQUE (player_id, cellNum, grid_id);

CREATE TYPE platform_enum AS ENUM ('Sleeper', 'MFL', 'Fleaflicker', 'FFPC', 'ESPN');

CREATE TYPE league_type AS ENUM ('Dynasty', 'Redraft');

-- league info table
CREATE TABLE league_info (
    league_id VARCHAR(20) PRIMARY KEY,
    season VARCHAR(5) NOT NULL,
    platform platform_enum DEFAULT 'Sleeper' NOT NULL,
    league_type league_type,
    teams INTEGER,
    starters INTEGER,
    ppr DECIMAL(4, 2),
    tep DECIMAL(4, 2),
    is_superflex BOOLEAN,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (league_id, season, platform)
);

CREATE INDEX idx_league_id ON league_info (league_id);

-- trades table
CREATE TABLE trades (
    transaction_id  VARCHAR(20) PRIMARY KEY,
    sideA TEXT[],
    sideB TEXT[],
    transaction_date TIMESTAMP,
    platform platform_enum DEFAULT 'Sleeper' NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    league_id VARCHAR(20) REFERENCES league_info (league_id),
    UNIQUE (transaction_id, platform)
);

CREATE INDEX idx_sideA ON trades USING GIN (sideA);
CREATE INDEX idx_sideB ON trades USING GIN (sideB);
CREATE INDEX idx_trade_league_id ON trades (league_id);
create index inx_trade_transaction_date on trades (transaction_date);

-- Create the users table
CREATE TABLE users (
    user_id VARCHAR(10) PRIMARY KEY,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    image_url TEXT,
    leagues JSONB[] DEFAULT '{}'::JSONB[],
    pr_presets JSONB[] DEFAULT '{}'::JSONB[],
    lf_presets JSONB[] DEFAULT '{}'::JSONB[],
    updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    description VARCHAR(500),
    twitter_handle VARCHAR(50),
    can_write BOOLEAN DEFAULT TRUE;
);

create index inx_trade_user_id on users (user_id);

-- add trigger to player metadata table
CREATE TRIGGER users_updated_at BEFORE
UPDATE
    ON users FOR EACH ROW EXECUTE PROCEDURE trigger_get_current_timestamp();

-- historical gridirons table
create table historical_connections (
	id Serial primary key, 
	daily_connections text not null,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

create index historical_connections_uindex on historical_connections (id);

-- Define the enum type for blog post categories
CREATE TYPE article_category AS ENUM ('Start/Sit', 'Redraft Strategy', 'Dynasty Strategy', 'Player Discussion', 'Injuries', 'Rookies', 'IDP', 'Dynasty Daddy', 'Other');

CREATE TYPE article_status AS ENUM ('Draft', 'Private', 'Public', 'Deleted');

-- Create the blog_posts table
CREATE TABLE articles (
    article_id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    title_img VARCHAR(255),
    post TEXT,
    keywords VARCHAR(255)[],
    linked_players VARCHAR(255)[],
    author_id VARCHAR(10) REFERENCES users(user_id),
    category article_category,
	status article_status,
    posted_at TIMESTAMP DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

create index inx_article_id on articles (article_id);
CREATE INDEX idx_articles_keywords_gin ON articles USING GIN(keywords);
CREATE INDEX idx_articles_linked_players_gin ON articles USING GIN(linked_players);
CREATE INDEX idx_articles_author_id ON articles(author_id);
CREATE INDEX idx_articles_category ON articles(category);

-- add trigger to player metadata table
CREATE TRIGGER articles_updated_at BEFORE
UPDATE
    ON articles FOR EACH ROW EXECUTE PROCEDURE trigger_get_current_timestamp();
      
-- Create article likes linking table
CREATE TABLE article_likes (
    article_id INTEGER REFERENCES articles(article_id),
    user_id VARCHAR(10) REFERENCES users(user_id),
    is_active BOOLEAN,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (article_id, user_id)
);

CREATE INDEX idx_article_likes_article_id ON article_likes(article_id);
CREATE INDEX idx_article_likes_user_id ON article_likes(user_id);
CREATE INDEX idx_article_likes_is_active ON article_likes(is_active);

-- add trigger to player metadata table
CREATE TRIGGER article_likes_updated_at BEFORE
UPDATE
    ON article_likes FOR EACH ROW EXECUTE PROCEDURE trigger_get_current_timestamp();

-- create trivia events games
CREATE TABLE trivia_events_games (
    id SERIAL PRIMARY KEY,
    event_id INT,
    name VARCHAR(255),
    game_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- league drafts table
CREATE TABLE league_drafts (
    draft_id VARCHAR(20) PRIMARY key UNIQUE,
    status VARCHAR(50),
    season INTEGER,
    player_type INTEGER,
    draft_type VARCHAR(50),
    rounds INTEGER,
    round_reversal INTEGER,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    platform platform_enum DEFAULT 'Sleeper' NOT NULL,
    league_id VARCHAR(20) REFERENCES league_info(league_id),
    is_scraped BOOLEAN DEFAULT false,
    is_idp BOOLEAN default false,
    auction_budget INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

create index league_draft_year_index on league_drafts (season);
create index league_draft_player_type_index on league_drafts (player_type);
create index league_draft_ended_at_index on league_drafts (ended_at);

CREATE TABLE league_draft_picks (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(10),
    pick_no INTEGER,
    round INTEGER,
    auction_amount INTEGER,
    budget_ratio DECIMAL,
    platform platform_enum DEFAULT 'Sleeper' NOT NULL,
    draft_id VARCHAR(20) REFERENCES league_drafts(draft_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

create index league_draft_picks_player_id on league_draft_picks (player_id);

ALTER TABLE league_drafts
ADD CONSTRAINT unique_draft_id_season_platform UNIQUE (draft_id, season, platform);

-- Indexes for league_drafts table
CREATE INDEX idx_player_type ON league_drafts(player_type);
CREATE INDEX idx_ended_at ON league_drafts(ended_at);
CREATE INDEX idx_is_idp ON league_drafts(is_idp);
CREATE INDEX idx_draft_type ON league_drafts(draft_type);

-- Indexes for league_info table
CREATE INDEX idx_is_superflex ON league_info(is_superflex);
CREATE INDEX idx_starters ON league_info(starters);
CREATE INDEX idx_teams ON league_info(teams);
CREATE INDEX idx_league_type ON league_info(league_type);
CREATE INDEX idx_ppr ON league_info(ppr);
CREATE INDEX idx_tep ON league_info(tep);
