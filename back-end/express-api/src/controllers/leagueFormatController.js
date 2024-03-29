import { HttpStatusCode } from 'axios';
import {
  CalculatePlayerConsistencyForSeason,
  CalculateWORPForSeason,
  FetchPointsPerWeekInSeason,
  getPositionsToProcess,
  FLEX_TYPES
} from '../middleware';
import {
  GetPlayersInfoWithIds
} from '../repository';
import {
  LEAGUE_FORMAT_TOOL_DATE
} from '../settings';

export const GetLeagueFormatForLeague = async (req, res) => {
  try {
    const {
      seasons, startWeek, endWeek, settings, format
    } = req.body;
    const experienceOffset = LEAGUE_FORMAT_TOOL_DATE - Math.max(...seasons);
    const posFilterList = (await getPositionsToProcess(format))
      .filter(p =>
        !FLEX_TYPES.includes(p));
    const posListString = posFilterList.map(pos =>
      `'${pos}'`);
    const playersInSystem = (await GetPlayersInfoWithIds(`AND ((pi.experience >= ${experienceOffset} AND pi.position IN (${posListString.join(', ')})) OR pi.position = 'DF')`)).rows;
    const pointsDict = await FetchPointsPerWeekInSeason(seasons, settings, startWeek, endWeek);
    const worp = await CalculateWORPForSeason(pointsDict, playersInSystem, format);
    const consistency = await CalculatePlayerConsistencyForSeason(
      pointsDict,
      playersInSystem,
      format,
      posFilterList
    );
    const leagueFormat = {};
    playersInSystem.forEach(p => {
      if (worp[p.name_id] && consistency[p.name_id]) {
        leagueFormat[p.name_id] = {
          w: worp[p.name_id],
          c: consistency[p.name_id]
        };
      }
    });
    res.status(HttpStatusCode.Ok).json(leagueFormat);
  } catch (err) {
    res.status(HttpStatusCode.InternalServerError).json(err.stack);
  }
};
