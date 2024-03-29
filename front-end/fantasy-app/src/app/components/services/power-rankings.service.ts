import { Injectable } from '@angular/core';
import { LeagueTeam } from '../../model/league/LeagueTeam';
import { FantasyMarket, FantasyPlayer } from '../../model/assets/FantasyPlayer';
import { PositionGroup, PositionPowerRanking, TeamPowerRanking } from '../model/powerRankings';
import { LeagueService } from '../../services/league.service';
import { PlayerService } from '../../services/player.service';
import { Observable, of, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatchupService } from './matchup.service';
import { NflService } from '../../services/utilities/nfl.service';
import { StatService } from '../../services/utilities/stat.service';
import { LeagueType } from '../../model/league/LeagueDTO';
import { LeaguePlatform } from '../../model/league/FantasyPlatformDTO';
import { UntypedFormControl } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class PowerRankingsService {

  constructor(private leagueService: LeagueService,
    public playerService: PlayerService,
    private matchupService: MatchupService,
    private eloService: StatService,
    private nflService: NflService
  ) {

    this.playerService.playerValuesUpdated$
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        if (this.leagueService.isLeagueLoaded()) {
          this.reset();
          this.mapPowerRankings(
            this.leagueService.leagueTeamDetails,
            this.playerService.playerValues,
            this.leagueService?.selectedLeague?.leaguePlatform
          );
        }
      });
  }

  /** team power rankings */
  powerRankings: TeamPowerRanking[] = [];

  // list of expanded details for teams.
  expandedElement: any[] = [];

  /** supported position groups to power rank */
  positionGroups: string[] = ['QB', 'RB', 'WR', 'TE'];

  /** power ranking table cols to display */
  selectedMetrics = new UntypedFormControl([]);

  /** power rankings selected rankings */
  selectedRankings: string = 'avg_adp';

  /** TODO add custom visualizations to power rankings */
  powerRankingsVisualizations: string[] = ['overall'];

  /** dynasty rankings metric options */
  dynastyRankingMetricOptions: {}[] =
    [
      { 'value': PowerRankingMarket.KeepTradeCut, 'display': 'KeepTradeCut' },
      { 'value': PowerRankingMarket.FantasyCalc, 'display': 'FantasyCalc' },
      { 'value': PowerRankingMarket.DynastyProcess, 'display': 'DynastyProcess' },
      { 'value': PowerRankingMarket.DynastySuperflex, 'display': 'DynastySuperflex' }
    ]

  /** rederaft ranking metric options */
  redraftRankingMetricOptions: {}[] = [
    { 'value': PowerRankingMarket.ADP, 'display': 'Selected Season Rankings' },
    { 'value': PowerRankingMarket.KeepTradeCutRedraft, 'display': 'KeepTradeCut (Redraft)' },
    { 'value': PowerRankingMarket.FantasyCalcRedraft, 'display': 'FantasyCalc (Redraft)' },
  ]

  /** rankings options */
  rankingMarket: PowerRankingMarket = PowerRankingMarket.KeepTradeCut;

  /** Power Rankings table view setting */
  powerRankingsTableView: PowerRankingTableView = PowerRankingTableView.TradeValues;

  /** Subject that emits when the component has been destroyed. */
  protected _onDestroy = new Subject<void>();

  /**
   * Sorts team power rankings array by starter value
   */
  static sortOnStarterValue(teams: TeamPowerRanking[]): TeamPowerRanking[] {
    return teams.sort((teamA, teamB) => {
      return teamB.adpValueStarter - teamA.adpValueStarter;
    });
  }

  /**
   * determines which player has the higher value
   * @param player1
   * @param player2
   * @private
   */
  private getBetterPlayer(player1: FantasyPlayer, player2: FantasyPlayer): FantasyPlayer {
    // flex te's aren't as valuable
    const teModifier = 3;
    if (player1 && player2) {
      const player1ADP = player1.position === 'TE' ? player1?.[this.selectedRankings] * teModifier : player1?.[this.selectedRankings];
      const player2ADP = player2.position === 'TE' ? player2?.[this.selectedRankings] * teModifier : player2?.[this.selectedRankings];
      if (player1ADP < player2ADP) {
        return player1?.[this.selectedRankings] === 0 ? player2 : player1;
      } else {
        return player2?.[this.selectedRankings] === 0 ? player1 : player2;
      }
    } else if (player1) {
      return player1;
    } else {
      return player2;
    }
  }

  mapPowerRankings(
    teams: LeagueTeam[],
    players: FantasyPlayer[],
    leaguePlatform: LeaguePlatform = LeaguePlatform.SLEEPER
  ): Observable<TeamPowerRanking[]> {
    if (this.powerRankings.length === 0) {
      this.generatePowerRankings(teams, players, leaguePlatform).subscribe(processedTeams => {
        this.powerRankings = processedTeams;
      });
    }
    return of(this.powerRankings);
  }

  /**
   * maps players to player platform id's on rosters
   * @param teams
   * @param players
   * @param leaguePlatform
   */
  generatePowerRankings(
    teams: LeagueTeam[],
    players: FantasyPlayer[],
    leaguePlatform: LeaguePlatform
  ): Observable<TeamPowerRanking[]> {
    let newPowerRankings: TeamPowerRanking[] = [];
    const earlyPickThreshold = Math.round(teams.length / 3);
    const latePickThreshold = Math.round(teams.length * 2 / 3);
    try {
      teams?.map((team) => {
        const roster = [];
        let sfTradeValueTotal = 0;
        let tradeValueTotal = 0;
        // TODO refactor this section both comparisons are redundant
        for (const playerPlatformId of team?.roster?.players) {
          for (const player of players) {
            if (playerPlatformId === this.playerService.getPlayerPlatformId(player, leaguePlatform)) {
              roster.push(player);
              sfTradeValueTotal += player.sf_trade_value || 0;
              tradeValueTotal += player.trade_value || 0;
              break;
            }
          }
        }
        const positionRoster: PositionPowerRanking[] = [];
        for (const group of this.positionGroups) {
          let sfTradeValue = 0;
          let tradeValue = 0;
          let groupList: FantasyPlayer[] = [];
          groupList = roster.filter(player => {
            if (player.position === group) {
              sfTradeValue += player.sf_trade_value || 0;
              tradeValue += player.trade_value || 0;
              return player;
            }
          });
          positionRoster.push(new PositionPowerRanking(group, sfTradeValue, tradeValue, groupList));
        }
        const pickValues = players.filter(player => {
          return player.position === 'PI';
        });
        const picks: FantasyPlayer[] = [];
        let sfPickTradeValue = 0;
        let pickTradeValue = 0;
        if (this.leagueService.selectedLeague.type === LeagueType.DYNASTY) {
          const pickRanges = { EARLY: 'Early', MID: 'Mid', LATE: 'Late' }
          team.futureDraftCapital.map(pick => {
            let pickType = pickRanges.MID;
            if (pick.pick !== -1 && pick.pick <= earlyPickThreshold) pickType = pickRanges.EARLY;
            else if (pick.pick !== -1 && pick.pick >= latePickThreshold) pickType = pickRanges.LATE;
            const matchPick = pickValues.find(p => p.last_name.includes(pick.round.toString()) && p.first_name === pick.year
              && p.last_name.includes(pickType));
            if (matchPick) {
              sfPickTradeValue += matchPick?.sf_trade_value || 0;
              pickTradeValue += matchPick?.trade_value || 0;
              sfTradeValueTotal += matchPick?.sf_trade_value || 0;
              tradeValueTotal += matchPick?.trade_value || 0;
              matchPick.metadata = pick;
              picks.push(JSON.parse(JSON.stringify(matchPick)));
            }
          }
          );
        }
        const rankedPicks = new PositionPowerRanking('PI', sfPickTradeValue, pickTradeValue, picks);
        newPowerRankings.push(new TeamPowerRanking(team, positionRoster, sfTradeValueTotal, tradeValueTotal, rankedPicks));
      });
      newPowerRankings = this.rankTeams(newPowerRankings, this.leagueService.selectedLeague.isSuperflex);
    } catch (e: any) {
      console.error('Error Mapping League Data: ', e);
    }
    return of(newPowerRankings);
  }

  /**
   * sort position groups based on value
   * @param teams
   * @param isSuperflex
   */
  sortTeamPowerRankingGroups(teams: TeamPowerRanking[], isSuperflex: boolean): TeamPowerRanking[] {
    teams.map(team => {
      for (const group of team.roster) {
        group.players.sort((a, b) => {
          return isSuperflex ? b.sf_trade_value - a.sf_trade_value : b.trade_value - a.trade_value;
        });
      }
      team.picks.players.sort((a, b) => {
        return Number(a.first_name) - Number(b.first_name)
          || (isSuperflex ? b.sf_trade_value - a.sf_trade_value : b.trade_value - a.trade_value);
      });
    });
    return teams;
  }

  /**
   * calculates and ranks teams based on trade value
   * @param teams
   * @param isSuperflex
   */
  rankTeams(teams: TeamPowerRanking[], isSuperflex: boolean): TeamPowerRanking[] {
    // Sort position groups and picks desc
    teams = this.sortTeamPowerRankingGroups(teams, isSuperflex);
    // Rank position groups
    this.positionGroups.forEach((value, index) => {
      // dynasty value rankings
      teams.sort((teamA, teamB) => {
        return isSuperflex ? teamB.roster[index].sfTradeValue - teamA.roster[index].sfTradeValue : teamB.roster[index].tradeValue - teamA.roster[index].tradeValue;
      });
      teams.forEach((team, teamIndex) => {
        team.roster[index].rank = teamIndex + 1;
      });
    });
    // Rank picks
    teams.sort((teamA, teamB) => {
      return isSuperflex ? teamB.picks.sfTradeValue - teamA.picks.sfTradeValue : teamB.picks.tradeValue - teamA.picks.tradeValue;
    });
    teams.forEach((team, teamIndex) => {
      team.picks.rank = teamIndex + 1;
    });
    // calculate best starting lineup
    teams = this.calculateADPValue(teams);
    // calculate elo adjusted ADP starter rank if matchups loaded properly
    if (this.matchupService.leagueMatchUpUI.length !== 0) {
      teams = this.calculateEloAdjustedADPValue(teams);
    }
    // Rank starting lineups
    teams = PowerRankingsService.sortOnStarterValue(teams);
    teams.forEach((team, index) => {
      team.starterRank = index + 1;
    });
    // starter value rankings
    this.positionGroups.forEach((value, index) => {
      teams.sort((teamA, teamB) => {
        return teamA.roster[index].starterValue - teamB.roster[index].starterValue;
      });
      teams.forEach((team, teamIndex) => {
        team.roster[index].starterRank = teamIndex + 1;
      });
    })
    teams.sort((teamA, teamB) => {
      return teamA.flexStarterValue - teamB.flexStarterValue;
    });
    teams.forEach((team, teamIndex) => {
      team.flexStarterRank = teamIndex + 1;
    });
    // rank overall points
    teams.sort((teamA, teamB) => {
      return !this.leagueService.selectedLeague.isSuperflex ? teamB.tradeValueOverall - teamA.tradeValueOverall : teamB.sfTradeValueOverall - teamA.sfTradeValueOverall;
    });
    teams.forEach((team, teamIndex) => {
      team.overallRank = teamIndex + 1;
    });
    teams = this.setTeamTiers(teams);
    teams = this.setTeamTiers(teams, false);
    return teams;
  }

  /**
   * Handles calculating ADP starter rank for all rosters
   */
  calculateADPValue(teams: TeamPowerRanking[]): TeamPowerRanking[] {
    const positionGroupCount: number[] = [];
    for (const pos of this.positionGroups) {
      positionGroupCount.push(this.getCountForPosition(pos));
    }
    positionGroupCount.push(this.getCountForPosition('FLEX'));
    positionGroupCount.push(this.getCountForPosition('SUPER_FLEX'));
    let worstTeamStarterValue: number = 0;
    teams.map(team => {
      let teamRosterCount: number[] = positionGroupCount.slice();
      if (teamRosterCount[PositionGroup.QB] > 0) // qb
      {
        const adpSortedQBs = this.sortPlayersByADP(team.roster[PositionGroup.QB].players);
        const starters = this.getHealthyPlayersFromList(adpSortedQBs, teamRosterCount[PositionGroup.QB]);
        team.roster[PositionGroup.QB].starterValue = starters.length > 0 ?
          starters.reduce((t, s) => t + (s?.[this.selectedRankings] || 100), 0) :
          teamRosterCount[PositionGroup.QB] * 100;
        team.starters.push(...starters);
      }
      if (teamRosterCount[PositionGroup.RB] > 0) // rb
      {
        const adpSortedRBs = this.sortPlayersByADP(team.roster[PositionGroup.RB].players);
        const starters = this.getHealthyPlayersFromList(adpSortedRBs, teamRosterCount[PositionGroup.RB]);
        team.roster[PositionGroup.RB].starterValue = starters.length > 0 ?
          starters.reduce((t, s) => t + (s?.[this.selectedRankings] || 100), 0) :
          teamRosterCount[PositionGroup.RB] * 100;
        team.starters.push(...starters);
      }
      if (teamRosterCount[PositionGroup.WR] > 0) // wr
      {
        const adpSortedWRs = this.sortPlayersByADP(team.roster[PositionGroup.WR].players);
        const starters = this.getHealthyPlayersFromList(adpSortedWRs, teamRosterCount[PositionGroup.WR]);
        team.roster[PositionGroup.WR].starterValue = starters.length > 0 ?
          starters.reduce((t, s) => t + (s?.[this.selectedRankings] || 100), 0) :
          teamRosterCount[PositionGroup.WR] * 100;
        team.starters.push(...starters);
      }
      if (teamRosterCount[PositionGroup.TE] > 0) // te
      {
        const adpSortedTEs = this.sortPlayersByADP(team.roster[PositionGroup.TE].players);
        const starters = this.getHealthyPlayersFromList(adpSortedTEs, teamRosterCount[PositionGroup.TE]);
        team.roster[PositionGroup.TE].starterValue = starters.length > 0 ?
          starters.reduce((t, s) => t + (s?.[this.selectedRankings] || 100), 0) :
          teamRosterCount[PositionGroup.TE] * 100;
        team.starters.push(...starters);
      }
      if (teamRosterCount[4] > 0) // flex
      {
        const response = this.getBestAvailableFlex(teamRosterCount[4], teamRosterCount, team);
        team = response.team
        teamRosterCount = response.teamRosterCount;
      }
      if (teamRosterCount[5] > 0) // sflex
      {
        const adpSortedQBs = this.sortPlayersByADP(team.roster[0].players);
        const superFlexQB = this.getHealthyPlayersFromList(adpSortedQBs, 1, team.starters);
        if (superFlexQB.length > 0) {
          team.starters.push(...superFlexQB);
          team.roster[PositionGroup.QB].starterValue += superFlexQB.reduce((v, qb) => v + (qb?.[this.selectedRankings] || 100), 0);
          teamRosterCount[PositionGroup.QB]++;
        } else {
          const response = this.getBestAvailableFlex(teamRosterCount[5], teamRosterCount, team);
          team = response.team
          teamRosterCount = response.teamRosterCount;
        }
      }
      for (const starter of team.starters) {
        team.adpValueStarter = Math.round(team.adpValueStarter + (starter?.[this.selectedRankings] || 100));
        worstTeamStarterValue = Math.max(worstTeamStarterValue, team.adpValueStarter);
      }
      // adjust starter rank for teams with not a full starting lineup
      if (team.starters.length < this.leagueService.selectedLeague.starters) {
        team.adpValueStarter +=
          Math.round(team.adpValueStarter + (this.leagueService.selectedLeague.starters - team.starters.length) * 100);
      }
    });
    teams.map(team => {
      team.adpValueStarter = (worstTeamStarterValue * 2) - team.adpValueStarter + 500;
      team.eloAdpValueStarter = team.adpValueStarter;
    });
    return teams;
  }

  /**
   * Sort a list of players by Average ADP
   * @param players
   */
  sortPlayersByADP(players: FantasyPlayer[]): FantasyPlayer[] {
    return players.slice().sort((a, b) => (a?.[this.selectedRankings] || 100) - (b?.[this.selectedRankings] || 100));
  }

  /**
   * Calculate each teams elo adjusted adp stater rating
   * @param teams teams to calculate elo for
   * @param endWeek current week to evaluate elo to
   */
  calculateEloAdjustedADPValue(
    teams: TeamPowerRanking[] = this.powerRankings,
    endWeek: number = this.nflService.getCompletedWeekForSeason(this.leagueService?.selectedLeague?.season)
  ): TeamPowerRanking[] {
    // handles 0 case
    if (endWeek <= this.leagueService.selectedLeague.startWeek - 1) {
      teams.forEach((team) => {
        team.eloAdpValueStarter = team.adpValueStarter;
        team.eloAdpValueChange = 0;
      });
      return teams;
    }
    // TODO find a better way to verify the match ups are mapped
    // map roster ids to indexes and reset elo
    const rosterIdMap = {};
    // start week modifier for leagues that didn't start week 1
    const startWeekMod = this.leagueService.selectedLeague.startWeek - 1;
    teams.forEach((team, ind) => {
      rosterIdMap[team.team.roster.rosterId] = ind;
      team.eloAdpValueStarter = team.eloADPValueStarterHistory.length > 0 ?
        team.eloADPValueStarterHistory[endWeek - startWeekMod] : team.adpValueStarter;
      team.eloAdpValueChange = team.eloADPValueStarterHistory.length > 0 ?
        (team.eloADPValueStarterHistory[endWeek - startWeekMod]) -
        (team.eloADPValueStarterHistory[endWeek - startWeekMod - 1] || team.adpValueStarter) : 0;
    });
    // if already calculated then use cache
    return teams[0].eloADPValueStarterHistory.length > 0 ? teams :
      this.initializeEloADPValueStarterHistory(teams, endWeek, rosterIdMap);
  }

  /**
   * Generates elo history map in object if it does not already exist
   * @param teams teams to generate map for
   * @param endWeek week to stop at
   * @param rosterIdMap map of match up to team
   * @private
   */
  private initializeEloADPValueStarterHistory(teams: TeamPowerRanking[], endWeek: number, rosterIdMap: {}): TeamPowerRanking[] {
    teams.forEach(team => {
      team.eloADPValueStarterHistory.push(team.eloAdpValueStarter);
    });
    for (let i = 0; i < endWeek - (this.leagueService.selectedLeague.startWeek - 1); i++) {
      // process this weeks match ups and set new elo
      this.matchupService.leagueMatchUpUI[i]?.forEach(matchUp => {
        const kValue = Math.max(10, Math.min(40, Math.round(Math.abs(matchUp.team1Points - matchUp.team2Points))));
        const newRatings = this.eloService.eloRating(
          teams[rosterIdMap[matchUp.team1RosterId]].eloAdpValueStarter,
          teams[rosterIdMap[matchUp.team2RosterId]].eloAdpValueStarter,
          kValue,
          matchUp.team1Points > matchUp.team2Points
        );
        // calculate change in elo
        teams[rosterIdMap[matchUp.team1RosterId]].eloAdpValueChange =
          Math.round(newRatings[0]) - teams[rosterIdMap[matchUp.team1RosterId]].eloAdpValueStarter;
        teams[rosterIdMap[matchUp.team2RosterId]].eloAdpValueChange =
          Math.round(newRatings[1]) - teams[rosterIdMap[matchUp.team2RosterId]].eloAdpValueStarter;
        // set new elo values
        teams[rosterIdMap[matchUp.team1RosterId]].eloAdpValueStarter = Math.round(newRatings[0]);
        teams[rosterIdMap[matchUp.team2RosterId]].eloAdpValueStarter = Math.round(newRatings[1]);
        teams[rosterIdMap[matchUp.team1RosterId]].eloADPValueStarterHistory.push(Math.round(newRatings[0]));
        teams[rosterIdMap[matchUp.team2RosterId]].eloADPValueStarterHistory.push(Math.round(newRatings[1]));
      });
      // handles bye weeks in playoffs
      teams.forEach(team => {
        if (team.eloADPValueStarterHistory.length === i + 1) {
          team.eloAdpValueChange = 0;
          team.eloADPValueStarterHistory.push(team.eloAdpValueStarter);
        }
      });
    }
    return teams;
  }

  /**
   * Determine what the tier bins are and assign teams a tier
   * @param teams
   * @private
   */
  private setTeamTiers(
    teams: TeamPowerRanking[],
    isStarter: boolean = true): TeamPowerRanking[] {
    const groups = this.eloService.bucketSort(teams, isStarter ? 'adpValueStarter' :
      (this.leagueService.selectedLeague.isSuperflex ? 'sfTradeValueOverall' : 'tradeValueOverall'), 4);
    // assign tier based on grouping
    groups.map((group, ind) => {
      // set super team if criteria is met
      if (group.length === 1 && ind === 0) {
        group[0][isStarter ? 'tier' : 'valueTier'] = ind;
        // set trust the process if criteria is met
      } else if (group.length === 1 && ind === groups.length - 1) {
        group[0][isStarter ? 'tier' : 'valueTier'] = 5;
      } else {
        group.map((team) => {
          team[isStarter ? 'tier' : 'valueTier'] = ind + 1;
        });
      }
    }
    )
    return teams;
  }

  /**
   * return list of healthy players from list
   * @param players list of players to choose from
   * @param numberOfPlayer number of players to choose
   * @param excludedPlayers players to exclude from search
   * @param excludedStatus injury status to exclude from active
   * @private
   */
  private getHealthyPlayersFromList(
    players: FantasyPlayer[],
    numberOfPlayer: number,
    excludedPlayers: FantasyPlayer[] = [],
    excludedStatus: string[] = ['PUP', 'IR', 'Sus', 'COV']
  ): FantasyPlayer[] {
    const activePlayers = [];
    players.map(player => {
      if (!excludedStatus.includes(player.injury_status) && activePlayers.length < numberOfPlayer && !excludedPlayers.includes(player)) {
        activePlayers.push(player);
      }
    });
    return activePlayers;
  }

  /**
   * determines the best available flex option for team by adp
   * @param spots
   * @param teamRosterCount
   * @param team
   * @private
   */
  private getBestAvailableFlex(spots: number, teamRosterCount: number[], team: TeamPowerRanking): { team: TeamPowerRanking, teamRosterCount: number[] } {
    // create clone for tracking flex
    const processedPlayers = teamRosterCount.slice();

    // selected player count
    let selectedCount = 0;
    // loop and get best flex option
    for (let i = 0; selectedCount < spots; i++) {
      const topRb = this.sortPlayersByADP(team.roster[1]?.players)[processedPlayers[1]];
      const topWr = this.sortPlayersByADP(team.roster[2]?.players)[processedPlayers[2]];
      const topTe = this.sortPlayersByADP(team.roster[3]?.players)[processedPlayers[3]];
      const flexPlayer = this.getBetterPlayer(topTe, this.getBetterPlayer(topRb, topWr));
      // if no player is found return
      if (!flexPlayer) {
        team.flexStarterValue += 100;
        selectedCount++;
      } else {
        processedPlayers[this.positionGroups.indexOf(flexPlayer.position)]++;
        const activeFlex = this.getHealthyPlayersFromList([flexPlayer], 1, team.starters);
        if (activeFlex.length > 0) {
          team.starters.push(flexPlayer);
          team.flexStarterValue += flexPlayer?.[this.selectedRankings]
          selectedCount++;
        }
      }
    }
    return { team, teamRosterCount };
  }

  /**
   * calculates the number of starter positions by position in league
   * @param position
   * @private
   */
  private getCountForPosition(position: string): number {
    return this.leagueService.selectedLeague.rosterPositions.filter(x => x === position).length;
  }

  /**
   * resets power rankings
   */
  reset(): void {
    this.powerRankings = [];
  }

  /**
   * gets rankings by team
   * @param rosterId selected roster id
   */
  findTeamFromRankingsByRosterId(rosterId: number): TeamPowerRanking {
    for (const team of this.powerRankings) {
      if (team.team.roster.rosterId === rosterId) {
        return team;
      }
    }
    return null;
  }

  /**
   * gets rankings by team
   * @param rosterId selected roster id
   */
  findTeamFromRankingsByUserId(userId: string): TeamPowerRanking {
    for (const team of this.powerRankings) {
      if (team.team.roster.ownerId === userId) {
        return team;
      }
    }
    return null;
  }

  /**
   * Fetch Team array if not top 20%
   * @param rosterId teams roster id
   * @returns 
   */
  getTeamNeedsFromRosterId(rosterId: number): string[] {
    const teamNeeds = [];
    const team = this.findTeamFromRankingsByRosterId(rosterId);
    team.roster.slice().sort((a, b) => b.rank - a.rank).forEach(pos => {
      if (pos.rank > this.powerRankings.length * .35) {
        teamNeeds.push(pos.position);
      }
    });

    return teamNeeds;
  }

  /**
   * get position group value based on settings
   * @param group 
   * @param metric 
   * @returns 
   */
  getPosGroupValue(group: PositionPowerRanking, metric: string = ''): number {
    if (metric === 'rank') {
      return group.rank;
    }
    return !this.leagueService.selectedLeague.isSuperflex ?
      group.tradeValue : group.sfTradeValue;
  }

  /**
   * get power rankings value based on settings
   * @param team 
   * @param metric
   * @returns 
   */
  getTeamPowerRankingValue(team: TeamPowerRanking, metric: string = ''): number {
    if (metric === 'rank') {
      return team.overallRank;
    }
    return !this.leagueService.selectedLeague.isSuperflex ?
      team.tradeValueOverall : team.sfTradeValueOverall
  }

  /**
   * Load presets for format tool
   * @param type preset to load
   */
  loadPRPreset(type: number = PowerRankingTableView.TradeValues): void {
    let powerRankingsTableCols = [];
    const isPreseason = this.leagueService.leagueTeamDetails[0].roster.teamMetrics.wins === 0
      && this.leagueService.leagueTeamDetails[0].roster.teamMetrics.losses === 0;
    const startCols = isPreseason ? ['teamOwner'] : ['teamOwner', 'record'];
    this.selectedRankings = isPreseason ? 'avg_adp' : 'avg_ros';
    switch (type) {
      case PowerRankingTableView.Starters:
        powerRankingsTableCols = [...startCols, 'tier', 'starterRank', 'qbStarterRank', 'rbStarterRank', 'wrStarterRank', 'teStarterRank', 'flexStarterRank'];
        this.rankingMarket = PowerRankingMarket.ADP;
        this.powerRankingsTableView = PowerRankingTableView.Starters;
        this.playerService.loadPlayerValuesForFantasyMarket$(FantasyMarket.FantasyCalcRedraft).subscribe(() => {
          this.playerService.selectedMarket = FantasyMarket.FantasyCalcRedraft;
        })
        break;
      case PowerRankingTableView.Experimental:
        powerRankingsTableCols = [...startCols, 'combinedTier', 'luck', 'overallRank', 'starterRank', 'qbRank', 'rbRank', 'wrRank', 'teRank'];
        this.rankingMarket = Number(this.playerService.selectedMarket);
        if (this.playerService.selectedMarket == FantasyMarket.FantasyCalcRedraft || this.playerService.selectedMarket == FantasyMarket.KeepTradeCutRedraft) {
          this.playerService.loadPlayerValuesForFantasyMarket$(FantasyMarket.KeepTradeCut).subscribe(() => {
            this.playerService.selectedMarket = FantasyMarket.KeepTradeCut;
            this.rankingMarket = PowerRankingMarket.KeepTradeCut;
          })
        }
        this.powerRankingsTableView = PowerRankingTableView.Experimental;
        if (this.leagueService.selectedLeague.type === LeagueType.DYNASTY) {
          powerRankingsTableCols.push('draftRank');
        }
        break;
      default:
        powerRankingsTableCols = [...startCols, 'tier', 'overallRank', 'starterRank', 'qbRank', 'rbRank', 'wrRank', 'teRank'];
        this.rankingMarket = Number(this.playerService.selectedMarket);
        if (this.playerService.selectedMarket == FantasyMarket.FantasyCalcRedraft || this.playerService.selectedMarket == FantasyMarket.KeepTradeCutRedraft) {
          this.playerService.loadPlayerValuesForFantasyMarket$(FantasyMarket.KeepTradeCut).subscribe(() => {
            this.playerService.selectedMarket = FantasyMarket.KeepTradeCut;
            this.rankingMarket = PowerRankingMarket.KeepTradeCut;
          })
        }
        this.powerRankingsTableView = PowerRankingTableView.TradeValues;
        if (this.leagueService.selectedLeague.type === LeagueType.DYNASTY) {
          powerRankingsTableCols.push('draftRank');
        }
    }
    this.selectedMetrics.setValue(powerRankingsTableCols);
  }
}

export enum PowerRankingMarket {
  KeepTradeCut,
  FantasyCalc,
  DynastyProcess,
  DynastySuperflex,
  KeepTradeCutRedraft,
  FantasyCalcRedraft,
  ADP = 100
}

export enum PowerRankingTableView {
  TradeValues,
  Starters,
  Experimental
}
