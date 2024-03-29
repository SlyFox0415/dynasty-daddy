import { Injectable } from "@angular/core";
import { Status } from "../model/status";
import { Observable, Subject, of } from "rxjs";
import { ConfigKeyDictionary, ConfigService, LocalStorageDictionary } from "src/app/services/init/config.service";
import { GridPlayer } from "../model/gridPlayer";
import { delay } from "rxjs/operators";
import { TriviaApiService } from "src/app/services/api/trivia/trivia-api.service";
import { MonthsAbbr } from "src/app/services/utilities/display.service";

@Injectable({
  providedIn: 'root'
})
export class GridGameService {

  status: Status = Status.LOADING;

  isHistoricalGrid: boolean = false;

  /** grid info from the db */
  gridDict = {};

  /** validation subject */
  validateGridSelection$: Subject<string> = new Subject<string>();

  /** already used player ids */
  alreadyUsedPlayers = [];

  /** all players to choose from */
  gridPlayers: GridPlayer[] = [];

  /** selected results grid */
  gridResults: any[][] = [
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null]
  ];

  /** how many guesses have been correct for each cell */
  globalSelectionMapping = {};

  /** most common answers for each spot on the grid */
  globalCommonAnsMapping = [];

  /** dict of college to espn id for img */
  collegeLogoMap = {
    'Michigan': 130,
    'Texas Christian': 2628,
    'Georgia': 61,
    'Ohio State': 194,
    'Florida': 57,
    'Alabama': 333,
    'Southern California': 30,
    'Louisiana State': 99,
    'Clemson': 228,
    'South Carolina': 2579,
    'North Carolina State': 152,
    'North Carolina': 153,
    'Wisconsin': 275,
    'Oregon': 2483,
    'Florida State': 52,
    'Texas': 251,
    'Oklahoma': 201,
    'Notre Dame': 87,
    'Miami': 2390
  }

  /** guesses left to make */
  guessesLeft: number = 9;

  /** toggle for mr unlimited mode */
  unlimitedMode: boolean = false;

  /** total games played from config table */
  gamesPlayed: number = 1;

  /** leaderboard for events */
  leaderboard: { name: string, score: number, date: string }[] = [];

  /** loading leaderboard status */
  leaderboardStatus: Status = Status.NONE;

  constructor(private triviaApiService: TriviaApiService,
    private configService: ConfigService) { }

  /** 
   * verifying wrapper that handles the results of a guess
   * @param player gridplayer
   * @param coors number array for grid coors
   */
  isSelectedPlayerCorrect(player: GridPlayer, coords: number[]): void {
    this.verifySelectedPlayer(player, [this.gridDict['xAxis'][coords[0]], this.gridDict['yAxis'][coords[1]]]).subscribe(res => {
      if (!this.unlimitedMode) {
        this.guessesLeft--;
      }
      if (res) {
        const x = coords[0] + 1;
        const y = coords[1] + 1;
        const cellNum = (coords[1] * 3) + coords[0];
        const percent = this.getPercentForPlayerSelected(player.id, cellNum, true);
        this.gridResults[x][y] = { name: player.name, img: player.headshot_url, id: player.id, percent: percent };
        this.alreadyUsedPlayers.push(player.id);
      }
      localStorage.setItem(LocalStorageDictionary.GRIDIRON_ITEM, JSON.stringify({ grid: this.gridDict, guesses: this.guessesLeft, results: this.gridResults, alreadyUsedPlayers: this.alreadyUsedPlayers }))
      this.validateGridSelection$.next();
    })
  }

  /**
   * Verify if selection in correct
   * @param player GridPlayer
   * @param categories categories to verify on
   */
  verifySelectedPlayer(player: GridPlayer, categories: any[]): Observable<boolean> {
    let isValid = true;
    categories.forEach(category => {
      switch (category.type) {
        case 'jersey_number': {
          isValid = player?.jersey_numbers?.includes(category.value) && isValid;
          break;
        }
        case 'college': {
          isValid = player?.college === category.value && isValid;
          break;
        }
        case 'draftedBy': {
          isValid = player?.draft_club && player?.draft_club === category.value && isValid;
          break;
        }
        case 'playedWith': {
          isValid = player?.played_with && player?.played_with.includes(category.value) && isValid;
          break;
        }
        case 'award': {
          isValid = player?.awards_json?.[category.value] && player?.awards_json?.[category.value] !== '' && isValid;
          break;
        }
        case 'stat': {
          switch (category.value) {
            case 'only1Team':
              isValid = new Set(player?.teams).size === 1 && isValid;
              break;
            case 'top10Pick':
              isValid = player?.draft_pick && player?.draft_pick <= 10 && isValid;
              break;
            case '1stRdPick':
              isValid = player?.draft_pick && player?.draft_pick <= 32 && isValid;
              break;
            case 'over100Pick':
              isValid = player?.draft_pick && player?.draft_pick >= 100 && isValid;
              break;
            default:
              isValid = player?.stats_json?.[category.value] && isValid;
              break;
          }
          break;
        }
        default: {
          isValid = player?.teams?.includes(category.value) && isValid;
        }
      }
    });
    // need a delay otherwise results component wont load for some reason
    return of(isValid).pipe(delay(500));
  }

  /**
   * calculate total selections for all grids
   */
  calculateTotalSelections(): void {
    this.gamesPlayed = 1;
    this.triviaApiService.fetchAllGridironResults(this.gridDict['id']).subscribe(res => {
      res.forEach(obj => {
        const { cellnum } = obj;
        if (cellnum == -1) {
          this.gamesPlayed = obj.guesses || 1;
        } else {
          if (this.globalSelectionMapping[cellnum]) {
            this.globalSelectionMapping[cellnum] += obj.guesses;
            if (this.globalCommonAnsMapping[cellnum].guesses < obj.guesses) {
              this.globalCommonAnsMapping[cellnum] = obj;
            }
          } else {
            this.globalSelectionMapping[cellnum] = obj.guesses;
            this.globalCommonAnsMapping[cellnum] = obj;
          }
        }
      });
      this.refreshPercents();
      for (let i = 0; i < 9; i++) {
        if (this.globalCommonAnsMapping[i]) {
          this.globalCommonAnsMapping[i].percent = this.getPercentForPlayerSelected(this.globalCommonAnsMapping[i].player_id, i);
        }
      }
    })
  }

  /**
   * Get percent for a player being selected
   * @param playerId player id
   * @param cellNum cell number
   */
  getPercentForPlayerSelected(playerId: number, cellNum: number, includePlayer: boolean = false): number {
    let percent = 0;
    const playerInc = includePlayer ? 1 : 0;
    if (!this.globalSelectionMapping[cellNum]) {
      return 1;
    }
    this.triviaApiService.fetchAllGridironResults(this.gridDict['id']).subscribe(res => {
      res.forEach(p => {
        if (p.player_id === playerId && p.cellnum === cellNum) {
          percent = (p.guesses + playerInc) / (this.globalSelectionMapping[cellNum] + playerInc);
          return;
        }
      })
    });
    if (percent === 0) {
      percent = playerInc / (this.globalSelectionMapping[cellNum] + playerInc);
    }
    return percent;
  }

  /**
   * batch persist results for grid
   */
  batchPersistGridResults(): void {
    const playerList = this.flattenGridToPlayerList();
    if (this.configService.getConfigOptionByKey(ConfigKeyDictionary.GRIDIRON_WRITE_BACK)?.configValue === 'true') {
      this.triviaApiService.postCorrectGridironAnswer(playerList, this.gridDict['id']).subscribe(_ => {
        // do nothing
      })
    }
  }

  /**
   * Refresh percents when loading players
   */
  private refreshPercents(): void {
    for (let i = 0; i < this.gridResults.length; i++) {
      const innerArray = this.gridResults[i];
      for (let j = 0; j < this.gridResults.length; j++) {
        if (innerArray[j]) {
          innerArray[j].percent = this.getPercentForPlayerSelected(innerArray[j].id, (j - 1) * 3 + (i - 1))
        }
      }
    }
  }

  /**
   * Return grid color based on rarity
   * @param percent percent to get cell color for
   */
  getCellColor(percent: number = 100): string {
    if (percent < 0.01) {
      return 'linear-gradient(to bottom right, #ADD8E6, #CC7DFF, #ADD8E6);'
    }
    if (percent < 0.05) {
      return 'linear-gradient(to bottom right, #FFD700, white, #FFD700);'
    }
    if (percent < 0.10) {
      return 'linear-gradient(to bottom right, silver, white, silver);'
    }
    if (percent < 0.15) {
      return 'linear-gradient(to bottom right, #cd7f32, white, #cd7f32);'
    }
    return '#008f51';
  }

  /**
   * flatten grid to player list
   */
  flattenGridToPlayerList(): { playerId, name, img, cellNum }[] {
    const playerList = [];
    for (let i = 0; i < this.gridResults.length; i++) {
      const innerArray = this.gridResults[i];
      for (let j = 0; j < this.gridResults.length; j++) {
        if (innerArray[j]) {
          playerList.push({ playerId: innerArray[j].id, cellNum: (j - 1) * 3 + (i - 1), name: innerArray[j].name, img: innerArray[j].img })
        }
      }
    }
    return playerList;
  }

  /**
   * calculate rarity score for Grid
   * @param picks list of players picked
   */
  calcScoresForGrid(picks: any[]): number {
    let score = picks.reduce((v, per) => v + this.getPercentForPlayerSelected(per.playerId, per.cellNum) * 100, 0);
    score += (9 - picks.length) * 100;
    return Math.round(score);
  }

  /**
 * load event leaderboard
 */
  loadLeaderboard(): void {
    this.leaderboard = [];
    this.leaderboardStatus = Status.LOADING;
    this.triviaApiService.getEventLeaderboard(this.gridDict['eventId']).pipe(delay(200))
    .subscribe(res => {
      const newScores = [];
      res.forEach(p => {
        const picks = p.game_json['grid'] as any[];
        const score = p.game_json?.['score'] ? p.game_json?.['score'] : this.calcScoresForGrid(picks);
        const date = new Date(p.created_at)
        newScores.push({ name: p.name, score: Math.round(score), date: `${MonthsAbbr[date.getMonth()]} ${date.getDate()}` })
      })
      this.leaderboard = newScores.sort((b, a) => b.score - a.score);
      this.leaderboardStatus = Status.DONE;
    })
  }
}
