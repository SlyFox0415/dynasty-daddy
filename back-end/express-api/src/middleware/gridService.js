/* eslint-disable consistent-return */
import {
  GetSearchPlayersInGrid,
  GetAllHistoricalGridirons,
  GetCurrentResults,
  PersistGridResult,
  GetEventGames,
  InsertEventGame
} from '../repository';

export const SearchGridPlayers = async (search) =>
  GetSearchPlayersInGrid(search);

export const FetchAllHistoricalGrids = async () =>
  GetAllHistoricalGridirons();

export const FetchAllGridResults = async (id) =>
  GetCurrentResults(id);

export const UpdateGridResultsWithAnswer = async (playerList, id) => {
  const validPlayerList = playerList.filter(p =>
    p.playerId != null);
  if (validPlayerList.length < 1) return id;

  await PersistGridResult(validPlayerList, id);
  return id;
};

export const FetchEventLeaderboard = async (id) =>
  GetEventGames(id);

export const PersistEventGame = async (eventId, name, gameJson) =>
  InsertEventGame(eventId, name, gameJson);
