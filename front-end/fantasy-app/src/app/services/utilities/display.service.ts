import { Injectable } from '@angular/core';
import { LeaguePlatform } from 'src/app/model/league/FantasyPlatformDTO';
import { TeamRankingTier, TeamRankingValueTier } from '../../components/model/powerRankings';
import { LeagueScoringFormat } from 'src/app/model/league/LeagueDTO';
import { FantasyMarket } from 'src/app/model/assets/FantasyPlayer';

/** League Platform logo URLS */
export const PlatformLogos = {
  SLEEPER_LOGO: 'https://play-lh.googleusercontent.com/Ox2yWLWnOTu8x2ZWVQuuf0VqK_27kEqDMnI91fO6-1HHkvZ24wTYCZRbVZfRdx3DXn4=w480-h960-rw',
  MFL_LOGO: 'http://myfantasyleague.com/images/mfl_logo/updates/new_mfl_logo_80x80.gif',
  FLEAFLICKER_LOGO: 'https://d1h60c43tcq0zx.cloudfront.net/static/images/icons/apple-touch-icon-f3d0ad2586e334ad16152ed2ea83733c.png',
  ESPN_LOGO: 'https://espnpressroom.com/us/files/2018/03/App-Icon-iOS-mic-flag-cut-to-shape.png',
  FFPC_LOGO: 'https://is1-ssl.mzstatic.com/image/thumb/Purple126/v4/28/c1/ba/28c1baf1-b1b1-f3c1-e5fe-185b41eff3b9/AppIcon-1x_U007emarketing-0-7-85-220.png/492x0w.webp',
}

export const PlatformNames = {
  SLEEPER: 'Sleeper',
  MFL: 'MFL',
  FLEAFLICKER: 'Fleaflicker',
  ESPN: 'ESPN',
  FFPC: 'FFPC',
}

export const FantasyMarketNames = {
  KEEPTRADECUT: 'KeepTradeCut',
  FANTASYCALC: 'FantasyCalc',
  DYNASTYPROCESS: 'DynastyProcess',
  DYNASTYSUPERFLEX: 'DynastySuperflex',
  KEEPTRADECUTREDRAFT: 'KeepTradeCut (Redraft)',
  FANTASYCALCREDRAFT: 'FantasyCalc (Redraft)',
}

export const GsisIdToName = {
  '00-0026498': 'Matthew Stafford',
  '00-0019596': 'Tom Brady',
  '00-0010346': 'Peyton Manning',
  '00-0022803': 'Eli Manning',
  '00-0023459': 'Aaron Rodgers',
  '00-0020531': 'Drew Brees',
  '00-0022942': 'Philip Rivers',
  '00-0022924': 'Ben Roethlisberger',
  '00-0033873': 'Patrick Mahomes',
  '00-0027939': 'Cam Newton',
  '00-0022921': 'Larry Fitzgerald',
  '00-0027793': 'Antonio Brown',
  '00-0027944': 'Julio Jones',
  '00-0011754': 'Randy Moss',
  '00-0033280': 'Christian McCaffrey',
  '00-0032764': 'Derrick Henry',
  '00-0025394': 'Adrian Peterson',
  '00-0025399': 'Marshawn Lynch',
  '00-0020536': 'LaDainian Tomlinson',
  '00-0012478': 'Terrell Owens',
  '00-0027656': 'Rob Gronkowski',
  '00-0027949': 'J.J. Watt',
  '00-0021140': 'Julius Peppers',
  '00-0033055': 'Jalen Ramsey',
  '00-0025401': 'Darrelle Revis',
  '00-0027940': 'Von Miller',
  '00-0031388': 'Aaron Donald',
  '00-0021377': 'Ed Reed',
  '00-0020337': 'Steve Smith'
}

export const MonthsAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

@Injectable({
  providedIn: 'root'
})
export class DisplayService {

  leagueTypes = ['Redraft', 'Keeper', 'Dynasty', 'Other'];

  constructor() {
  }

  /**
   * Get tier string from number
   * @param tier string
   */
  getTierFromNumber(tier: number): string {
    return TeamRankingTier[tier]?.replace(/_/g, ' ') || '-';
  }

  /**
 * Get value tier string from number
 * @param tier string
 */
  getValueTierFromNumber(tier: number): string {
    return TeamRankingValueTier[tier]?.replace(/_/g, ' ') || '-';
  }

  /**
   * Returns a string for the platform enum
   * @param leaguePlatform league platform enum
   * @returns 
   */
  getDisplayNameForPlatform(leaguePlatform: LeaguePlatform): string {
    switch (leaguePlatform) {
      case LeaguePlatform.FLEAFLICKER:
        return PlatformNames.FLEAFLICKER;
      case LeaguePlatform.ESPN:
        return PlatformNames.ESPN;
      case LeaguePlatform.MFL:
        return PlatformNames.MFL;
      case LeaguePlatform.FFPC:
        return PlatformNames.FFPC;
      default:
        return PlatformNames.SLEEPER;
    }
  }

  /**
 * Returns a string for the fantasy market enum
 * @param fantasyMarket fantasy market enum
 * @returns 
 */
  getDisplayNameForFantasyMarket(fantasyMarket: FantasyMarket): string {
    switch (fantasyMarket) {
      case FantasyMarket.KeepTradeCut:
        return FantasyMarketNames.KEEPTRADECUT;
      case FantasyMarket.FantasyCalc:
        return FantasyMarketNames.FANTASYCALC;
      case FantasyMarket.DynastyProcess:
        return FantasyMarketNames.DYNASTYPROCESS;
      case FantasyMarket.DynastySuperflex:
        return FantasyMarketNames.DYNASTYSUPERFLEX;
      case FantasyMarket.FantasyCalcRedraft:
        return FantasyMarketNames.FANTASYCALCREDRAFT;
      default:
        return FantasyMarketNames.KEEPTRADECUTREDRAFT;
    }
  }

  /**
   * get image string for platform
   * @param platform
   */
  getImageForPlatform(platform: LeaguePlatform): string {
    switch (platform) {
      case LeaguePlatform.ESPN:
        return PlatformLogos.ESPN_LOGO;
      case LeaguePlatform.FFPC:
        return PlatformLogos.FFPC_LOGO;
      case LeaguePlatform.FLEAFLICKER:
        return PlatformLogos.FLEAFLICKER_LOGO;
      case LeaguePlatform.MFL:
        return PlatformLogos.MFL_LOGO;
      default:
        return PlatformLogos.SLEEPER_LOGO;
    }
  }

  /**
   * Get string for league type
   * @param leagueType league type number
   * @returns 
   */
  getLeagueTypeFromTypeNumber(leagueType: number): string {
    return this.leagueTypes[leagueType];
  }

  /**
   * Formats date string for display
   * @param date date string to format
   */
  formatDateForDisplay = (date: string) =>
    new Date(date).toString().slice(4, 15);

  /**
   * Randomize list
   * @param array list to randomize
   * @returns 
   */
  shuffle(array: any[]): any[] {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }

    return array;
  }

  /**
* get league scoring format in string format but for display
*/
  getDisplayNameLeagueScoringFormat(scoringFormat: LeagueScoringFormat): string {
    switch (scoringFormat) {
      case LeagueScoringFormat.PPR:
        return 'PPR';
      case LeagueScoringFormat.STANDARD:
        return 'Standard';
      case LeagueScoringFormat.HALF_PPR:
        return 'Half PPR';
      default:
        return '-';
    }
  }

  /**
   * returns number of days since the date
   * @param date string for date
   */
  getDaysSinceDateString(date: string): number {
    const transactionDate = new Date(date);
    const currentDate = new Date();
    const timeDifference = currentDate.getTime() - transactionDate.getTime();

    return Math.floor(timeDifference / (1000 * 3600 * 24));
  }

  /**
   * get minutes to read words
   * @param words word count
   */
  getTimeToReadArticle(words: number): number {
    const min = Math.round(words * 0.0042)
    return min === 0 ? 1 : min;
  }

  /**
   * create pick string display
   * @param pick pick details
   * @private
   * returns string
   */
  createPickString(round: number, pick: number): string {
    return round.toString() + '.' + (pick > 9 ? pick.toString() : '0' + pick.toString());
  }

  /**
   * Returns a string format for PPR number
   * @param ppr number to format for ppr
   */
  getPPRFormatDisplay(ppr: number): string {
    switch (ppr) {
      case 1:
        return 'Full';
      case 0.5:
        return 'Half';
      case 0:
        return "No";
      default:
        return Number(ppr).toString();
    }
  }

}
