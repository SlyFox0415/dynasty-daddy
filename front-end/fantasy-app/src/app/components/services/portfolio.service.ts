import { Injectable } from '@angular/core';
import { of, Subject } from 'rxjs';
import { FantasyPlayer } from 'src/app/model/assets/FantasyPlayer';
import { LeaguePlatform } from 'src/app/model/league/FantasyPlatformDTO';
import { LeagueDTO } from 'src/app/model/league/LeagueDTO';
import { FantasyPlayerApiService } from 'src/app/services/api/fantasy-player-api.service';
import { FleaflickerService } from 'src/app/services/api/fleaflicker/fleaflicker.service';
import { MflApiService } from 'src/app/services/api/mfl/mfl-api.service';
import { SleeperApiService } from 'src/app/services/api/sleeper/sleeper-api.service';
import { PlayerService } from 'src/app/services/player.service';
import { DisplayService } from 'src/app/services/utilities/display.service';
import { Portfolio } from '../model/portfolio';
import { Status } from '../model/status';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {

  /** api call cache from dynasty daddy value db */
  fantasyPortfolioDict = {}

  /** portfolio mapping from local storage */
  portfolio: Portfolio;

  /** players with fantasy player mapping */
  playersWithValue: FantasyPlayer[] = [];

  /** emits when leagues have changed */
  portfolioLeaguesAdded$: Subject<void> = new Subject<void>();

  /** status to show account are loading */
  connectAccountStatus: Status = Status.DONE;

  /** emits on portfolio value updates */
  portfolioValuesUpdated$: Subject<void> = new Subject<void>();

  /** dict of platform ids for players, it uses the platform enum then the player id to map */
  playerPlatformIdMap: {} = {};

  /** player table metadata to display */
  playerHoldingMap: {} = {};

  /** league map to display in subtable */
  leagueIdMap: {} = {};

  /** selected leagues to load */
  appliedLeagues: { leagueId: string, platform: LeaguePlatform }[] = [];

  /** count of leagues applies, used for exposure */
  leagueCount: number = 0;

  /** mfl username */
  mflUsername: string = '';

  /** mfl password */
  mflPassword: string = '';

  /** sleeper username input */
  sleeperUsername: string = '';

  /** fleaflicker email string */
  fleaflickerEmail: string = '';

  constructor(
    private fantasyPlayerApiService: FantasyPlayerApiService,
    private sleeperApiService: SleeperApiService,
    private mflApiService: MflApiService,
    private fleaflickerService: FleaflickerService,
    private displayService: DisplayService,
    private playerService: PlayerService,
  ) {

  }

  /**
   * Update player portfolio based on selected leagues
   * @param leagueList List of leagues from dropdown
   */
  updatePortfolio(): void {
    this.playersWithValue = [];
    this.playerHoldingMap = {};
    this.leagueCount = 0;
    this.appliedLeagues.forEach(league => {
      this.leagueCount++;
      const leagueInfo = this.portfolio.leagues[league.platform]?.leagues?.find(l => l.leagueId === league.leagueId);
      this.leagueIdMap[league.leagueId] = {
        name: leagueInfo.name,
        scoring: league.platform !== LeaguePlatform.FLEAFLICKER ? leagueInfo.getDisplayNameLeagueScoringFormat() : '-',
        isSuperflex: leagueInfo.isSuperflex ? 'Superflex' : '1 QB',
        startCount: 'Start ' + leagueInfo.rosterPositions.filter(p => ['QB', 'RB', 'WR', 'TE', 'FLEX', 'SUPER_FLEX'].includes(p)).length,
        platformDisplay: this.displayService.getDisplayNameForPlatform(leagueInfo.leaguePlatform),
        platform: leagueInfo.leaguePlatform,
        year: leagueInfo.season,
        rosters: leagueInfo.totalRosters + ' Teams',
        leagueType: this.displayService.getLeagueTypeFromTypeNumber(leagueInfo.type)
      };
      const uniquePlayers: string[] = [...new Set(leagueInfo?.metadata?.['roster'] as string[] || [])]
      this.addPlayersToList(uniquePlayers, leagueInfo)
    });
    const playersToGet = this.playersWithValue.filter(p => !this.fantasyPortfolioDict[p.name_id] && ['QB', 'RB', 'WR', 'TE'].includes(p.position)).map(p => p?.name_id)
    this.fantasyPlayerApiService.getFantasyPortfolio(181, playersToGet).subscribe(
      p => {
        for (let key in p) {
          this.fantasyPortfolioDict[key] = p[key];
        }
        this.portfolioValuesUpdated$.next();
      }
    );
  }

  /**
   * Handles processes players to display for the portfolio
   * @param leaguePlayers List of player ids
   * @param league LeagueDTO
   */
  private addPlayersToList(leaguePlayers: string[], league: LeagueDTO): void {
    leaguePlayers.forEach(platformId => {
      let ddPlayer = this.playerService.getPlayerByPlayerPlatformId(platformId, league.leaguePlatform);
      if (!ddPlayer) {
        const playerInfo = this.playerPlatformIdMap[league.leaguePlatform]?.[platformId];
        if (playerInfo) {
          ddPlayer = new FantasyPlayer();
          ddPlayer.name_id = playerInfo.full_name;
          ddPlayer.full_name = playerInfo.full_name;
          ddPlayer.sf_trade_value = 0;
          ddPlayer.trade_value = 0;
          ddPlayer.team = playerInfo.team;
          ddPlayer.position = playerInfo.position;
        }
      }
      if (ddPlayer) {
        if (this.playersWithValue.map(it => it.name_id).includes(ddPlayer.name_id)) {
          this.playerHoldingMap[ddPlayer.name_id].shares++;
          this.playerHoldingMap[ddPlayer.name_id][league.isSuperflex ? 'superflex' : 'standard']++;
          this.playerHoldingMap[ddPlayer.name_id].leagues.push(league.leagueId);
          this.playerHoldingMap[ddPlayer.name_id].totalValue += league.isSuperflex ? ddPlayer.sf_trade_value : ddPlayer.trade_value;
        } else {
          this.playerHoldingMap[ddPlayer.name_id] = {
            shares: 1,
            superflex: league.isSuperflex ? 1 : 0,
            standard: league.isSuperflex ? 0 : 1,
            totalValue: league.isSuperflex ? ddPlayer.sf_trade_value : ddPlayer.trade_value,
            leagues: [league.leagueId],
          }
          this.playersWithValue.push(ddPlayer);
        }
      }
    });
  }

  /**
   * Loads player id map for extra players when using the portfolio
   * @param platform platform to load
   * @param leagueId optional league id for MFL
   * @param year optional year for mfl
   */
  setPlatformIdMaps(platform: LeaguePlatform, leagueId: string = '', year: string = ''): void {
    this.connectAccountStatus = Status.LOADING;
    switch (platform) {
      case LeaguePlatform.FLEAFLICKER: {
        this.playerPlatformIdMap[LeaguePlatform.FLEAFLICKER] = this.fleaflickerService.playerIdMap;
        break;
      }
      case LeaguePlatform.SLEEPER: {
        if (!this.playerPlatformIdMap[LeaguePlatform.SLEEPER]) {
          this.sleeperApiService.fetchAllSleeperPlayers().subscribe((players) => {
            this.playerPlatformIdMap[LeaguePlatform.SLEEPER] = players
            return of(players);
          });
        }
        break;
      }
      case LeaguePlatform.MFL: {
        if (!this.playerPlatformIdMap[LeaguePlatform.MFL]) {
          this.mflApiService.getMFLPlayers(year, leagueId).subscribe((players) => {
            this.playerPlatformIdMap[LeaguePlatform.MFL] = players
            return of(players);
          });
        }
        break;
      }
    }
  }
}