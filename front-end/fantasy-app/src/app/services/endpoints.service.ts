import { Injectable } from '@angular/core';
import { FantasyPlayerApiConfigService } from './api/fantasy-player-api-config.service';
import { SleeperApiConfigService } from './api/sleeper/sleeper-api-config.service';
import { ConfigApiConfigService } from './api/config/config-api-config.service';
import { MflApiConfigService } from './api/mfl/mfl-api-config.service';
import { FleaflickerApiConfigService } from './api/fleaflicker/fleaflicker-api-config.service';
import { ESPNApiConfigService } from './api/espn/espn-api-config.service';
import { FFPCApiConfigService } from './api/ffpc/ffpc-api-config.service';
import { PatreonAPIConfigService } from './api/patreon/patreon-api-config.service';
import { ArticlesApiConfigService } from './api/articles/articles-api-config.service';
import { TriviaApiConfigService } from './api/trivia/trivia-api-config.service';

@Injectable({
  providedIn: 'root'
})
export class EndpointsService {

  // TODO add cloud base url for api
  private baseUrl = 'https://dynasty-daddy.com/api';
  // uncomment for dev environment
  // private baseUrl = 'http://localhost:3000/api';

  constructor(private fantasyPlayerApiConfigService: FantasyPlayerApiConfigService,
    private sleeperApiConfigService: SleeperApiConfigService,
    private patreonApiConfigService: PatreonAPIConfigService,
    private mflAPIConfigService: MflApiConfigService,
    private fleaflickerApiConfigService: FleaflickerApiConfigService,
    private ffpcApiConfigService: FFPCApiConfigService,
    private triviaApiConfigService: TriviaApiConfigService,
    private espnApiConfigService: ESPNApiConfigService,
    private articlesApiConfigService: ArticlesApiConfigService,
    private configApiConfigService: ConfigApiConfigService) {
  }

  public assignEndpoints(): void {

    // config option endpoint
    this.configApiConfigService.getConfigOptionsEndpoint = this.baseUrl + '/v1/config/all';

    // Dynasty Daddy Endpoints
    this.fantasyPlayerApiConfigService.getPlayerValuesForTodayEndpoint = this.baseUrl + '/v1/player/all/today';
    this.fantasyPlayerApiConfigService.getPlayerValuesForMarketEndpoint = this.baseUrl + '/v1/player/all/market/';
    this.fantasyPlayerApiConfigService.getNonOffensePlayersEndpoint = this.baseUrl + '/v1/player/all/special';
    this.fantasyPlayerApiConfigService.getPrevPlayerValuesEndpoint = this.baseUrl + '/v1/player/all/prev/';
    this.fantasyPlayerApiConfigService.getHistoricalPlayerValuesEndpoint = this.baseUrl + '/v1/player/';
    this.fantasyPlayerApiConfigService.getPlayerDetailsEndpoint = this.baseUrl + '/v1/player/details/';
    this.fantasyPlayerApiConfigService.getPlayerTradeEndpoint = this.baseUrl + '/v1/player/details/trade/';
    this.fantasyPlayerApiConfigService.getFantasyPortfolioEndpoint = this.baseUrl + '/v1/portfolio';
    this.fantasyPlayerApiConfigService.getLeagueFormatEndpoint = this.baseUrl + '/v1/league/format';
    this.fantasyPlayerApiConfigService.postLeaguesToDatabaseEndpoint = this.baseUrl + '/v1/league/add';
    this.fantasyPlayerApiConfigService.searchTradeDatabaseEndpoint = this.baseUrl + '/v1/trade/search';
    this.fantasyPlayerApiConfigService.getRecentTradeVolumeEndpoint = this.baseUrl + '/v1/trade/volume';
    this.fantasyPlayerApiConfigService.searchDraftADPEndpoint = this.baseUrl + '/v1/draft/adp';
    this.fantasyPlayerApiConfigService.searchDraftADPDetailsEndpoint = this.baseUrl + '/v1/draft/adp/details';

    // trivia game endpoints
    this.triviaApiConfigService.searchGridPlayersEndpoint = this.baseUrl + '/v1/grid/players';
    this.triviaApiConfigService.getHistoricalGridironsEndpoint = this.baseUrl + '/v1/grid/archive';
    this.triviaApiConfigService.postCorrectAnswerEndpoint = this.baseUrl + '/v1/grid/results/add';
    this.triviaApiConfigService.getAllGridResultsEndpoint = this.baseUrl + '/v1/grid/results';
    this.triviaApiConfigService.saveEventGameEndpoint = this.baseUrl + '/v1/event';
    this.triviaApiConfigService.getLeaderboardEndpoint = this.baseUrl + '/v1/event/leaderboard';

    // patreon apis
    this.patreonApiConfigService.addLeaguesToUserEndpoint = this.baseUrl + '/v1/user/leagues';
    this.patreonApiConfigService.addPRPresetsToUserEndpoint = this.baseUrl + '/v1/user/presets/pr';
    this.patreonApiConfigService.addLFPresetsToUserEndpoint = this.baseUrl + '/v1/user/presets/lf';
    this.patreonApiConfigService.updateUserProfileEndpoint = this.baseUrl + '/v1/user/profile';

    // articles apis
    this.articlesApiConfigService.postArticleEndpoint = this.baseUrl + '/v1/user/:userId/article/post';
    this.articlesApiConfigService.searchArticlesEndpoint = this.baseUrl + '/v1/article/search';
    this.articlesApiConfigService.likeArticleEnpoint = this.baseUrl + '/v1/article/like';
    this.articlesApiConfigService.fullArticleEndpoint = this.baseUrl + '/v1/article/details/';
    this.articlesApiConfigService.getArticlesForUserEndpoint = this.baseUrl + '/v1/article/user/';
    this.articlesApiConfigService.deleteArticleEndpoint = this.baseUrl + '/v1/article/delete';

    // Sleeper Endpoints
    this.sleeperApiConfigService.getSleeperUsernameEndpoint = 'https://api.sleeper.app/v1/user/';
    this.sleeperApiConfigService.getSleeperLeagueEndpoint = 'https://api.sleeper.app/v1/league/';
    this.sleeperApiConfigService.getSleeperDraftEndpoint = 'https://api.sleeper.app/v1/draft/';
    this.sleeperApiConfigService.getSleeperStatsEndpoint = 'https://api.sleeper.app/v1/stats/nfl/regular/';
    this.sleeperApiConfigService.getSleeperProjectionsEndpoint = 'https://api.sleeper.app/v1/projections/nfl/regular/';
    this.sleeperApiConfigService.getSleeperNFLStateEndpoint = 'https://api.sleeper.app/v1/state/nfl';
    this.sleeperApiConfigService.getSleeperPlayersEndpoint = 'https://api.sleeper.app/v1/players/nfl';

    // mfl endpoints
    this.mflAPIConfigService.getMFLLeagueEndpoint = this.baseUrl + '/v1/mfl/league';
    this.mflAPIConfigService.getMFLPlayersEndpoint = this.baseUrl + '/v1/mfl/players';
    this.mflAPIConfigService.getMFLScheduleEndpoint = this.baseUrl + '/v1/mfl/schedule';
    this.mflAPIConfigService.getMFLTransactionsEndpoint = this.baseUrl + '/v1/mfl/transactions';
    this.mflAPIConfigService.getMFLDraftResultsEndpoint = this.baseUrl + '/v1/mfl/draftResults';
    this.mflAPIConfigService.getMFLLeaguesForUser = this.baseUrl + '/v1/mfl/leagues';
    this.mflAPIConfigService.getMFLLeagueStandingEndpoint = this.baseUrl + '/v1/mfl/leagueStandings';
    this.mflAPIConfigService.getMFLLeagueRulesEndpoint = this.baseUrl + '/v1/mfl/rules';
    this.mflAPIConfigService.getMFLRostersEndpoint = this.baseUrl + '/v1/mfl/rosters';
    this.mflAPIConfigService.getMFLFutureDraftPicksEndpoint = this.baseUrl + '/v1/mfl/futureDraftPicks';
    this.mflAPIConfigService.postMFLWaiverMoveEndpoint = this.baseUrl + '/v1/mfl/waiver';

    // Fleaflicker Endpoints
    this.fleaflickerApiConfigService.getFFLeagueEndpoint = this.baseUrl + '/v1/ff/league';
    this.fleaflickerApiConfigService.getFFLeagueStandingEndpoint = this.baseUrl + '/v1/ff/leagueStandings';
    this.fleaflickerApiConfigService.getFFRostersEndpoint = this.baseUrl + '/v1/ff/rosters';;
    this.fleaflickerApiConfigService.getFFScheduleEndpoint = this.baseUrl + '/v1/ff/schedule';
    this.fleaflickerApiConfigService.getFFTransactionsEndpoint = this.baseUrl + '/v1/ff/transactions';
    this.fleaflickerApiConfigService.getFFFutureDraftPicksEndpoint = this.baseUrl + '/v1/ff/futureDraftPicks';
    this.fleaflickerApiConfigService.getFFTradesEndpoint = this.baseUrl + '/v1/ff/trades';
    this.fleaflickerApiConfigService.getFFDraftResultsEndpoint = this.baseUrl + '/v1/ff/draftResults';
    this.fleaflickerApiConfigService.getUserLeagueEndpoint = this.baseUrl + '/v1/ff/user';

    // FFPC Endpoints
    this.ffpcApiConfigService.getFFPCLeagueEndpoint = this.baseUrl + '/v1/ffpc/league';
    this.ffpcApiConfigService.getFFPCLeagueStandingEndpoint = this.baseUrl + '/v1/ffpc/leagueStandings';
    this.ffpcApiConfigService.getFFPCRostersEndpoint = this.baseUrl + '/v1/ffpc/rosters';;
    this.ffpcApiConfigService.getFFPCScheduleEndpoint = this.baseUrl + '/v1/ffpc/schedule';
    this.ffpcApiConfigService.getFFPCTransactionsEndpoint = this.baseUrl + '/v1/ffpc/transactions';
    this.ffpcApiConfigService.getFFPCDraftResultsEndpoint = this.baseUrl + '/v1/ffpc/draftResults';
    this.ffpcApiConfigService.getFFPCLeaguesForUser = this.baseUrl + '/v1/ffpc/user';

    // ESPN Endpoints
    this.espnApiConfigService.getESPNLeagueEndpoint = this.baseUrl + '/v1/espn/league';
    this.espnApiConfigService.getESPNTransactionsEndpoint = this.baseUrl + '/v1/espn/transactions';
  
    // Patreon Endpoints
    this.patreonApiConfigService.getUserFromPatreonEndpoint = this.baseUrl + '/v1/patreon/token';    
  }
}
