import { Component, OnInit } from "@angular/core";
import { BaseComponent } from "../base-component.abstract";
import { ConfigKeyDictionary, ConfigService, LocalStorageDictionary } from "src/app/services/init/config.service";
import { Status } from "../model/status";
import { GridGameService } from "../services/grid.service";
import { MatDialog } from "@angular/material/dialog";
import { SearchGridPlayerModal } from "../modals/search-grid-player-modal/search-grid-player-modal.component";
import { GridResultModalComponent } from "../modals/grid-result-modal/grid-result-modal.component";
import { PageService } from "src/app/services/utilities/page.service";
import { SimpleTextModalComponent } from "../sub-components/simple-text-modal/simple-text-modal.component";
import { Observable } from "rxjs";
import { TriviaApiService } from "src/app/services/api/trivia/trivia-api.service";
import { GsisIdToName } from "src/app/services/utilities/display.service";

@Component({
    selector: 'grid-game',
    templateUrl: './grid-game.component.html',
    styleUrls: ['./grid-game.component.scss']
})
export class GridGameComponent extends BaseComponent implements OnInit {

    /** page description */
    pageDescription = 'Test your NFL player knowledge with NFL Immaculate Gridiron. Similar to the popular game immaculate grid, you must guess players who meet the two criteria that intersect on the grid. A new puzzle is created every day at 5:00 AM EST.'

    /** team acc placeholder */
    TEAM_ACC_PLACEHOLDER = 'TEAM_ACC';

    /** nfl url */
    teamImgURL = 'https://a.espncdn.com/i/teamlogos/nfl/500/TEAM_ACC.png';

    /** college url */
    collegeImgURL = 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/TEAM_ACC.png';

    menuItems: Observable<any[]>;

    nameMapping: {};

    /** help menu bullet points */
    helpBullets = [{
        list: [
            "Select a player for each cell that matches the criteria for that cell's row and column.",
            "For a player to be considered valid for a team, he must've suited up for one NFL regular season game for that team.",
            "If a cell is for a team and an award, the award must have been won after 1999 but didn't have to be on the team when winning the award.",
            "If a cell is for a team and a season stat, the player you select must have recorded that stat after 1999 but didn't have to be on the team when recording that stat.",
            "If you select a player for a cell with a stat, that player must've accumulated that stat in a completed season/game from 1999 or later.",
            "If you select a player for a cell with a college, that player must have been drafted from that college. If a player transfers colleges, the college they transfer to is the college.",
            "If a cell is for a college and a season stat, the player you select must have been drafted from that college and accumulated that stat in the NFL (not in college).",
            "If a cell is for a player that played with that player, the player you select must have been active one week with that player.",
            "A player cannot be used twice.",
            "You have 9 guesses to fill out the grid.",
            "Each guess, whether correct or incorrect, counts as a guess.",
            "You can guess active or inactive NFL players.",
            "There is a new grid every day at 5 AM EST."]
    }];

    seasonStats = ['rushYd1000',
        'recYd1000',
        'passYd4000',
        'rushTds10',
        'recTds10',
        'passingTds30',
        'ints10',
        'rec100',
        'defTkl100',
        'defFF4',
        'defSacks10',
        'defInts6',
        'defTds2',
        'defSafe1',
        'specialTds2']

    constructor(public configService: ConfigService,
        private dialog: MatDialog,
        private pageService: PageService,
        private triviaApiService: TriviaApiService,
        public gridGameService: GridGameService) {
        super();
        this.pageService.setUpPageSEO('NFL Immaculate Gridiron',
            ['nfl', 'immaculate', 'grid', 'trivia', 'football', 'game', 'nfl trivia',
                'immaculate grid', 'grid trivia', 'nfl game', 'football trivia',
                'crossover', 'pro football reference', 'daily grid', 'weddle'],
            this.pageDescription)
    }

    ngOnInit(): void {
        this.gridGameService.status = Status.LOADING;
        this.addSubscriptions(
            this.configService.configValuesLoaded$.subscribe(_ => {
                this.initGridGame();
            }),
            this.gridGameService.validateGridSelection$.subscribe(_ => {
                if (this.gridGameService.guessesLeft === 0) {
                    this.gridGameService.batchPersistGridResults();
                    this.openResults();
                }
            }));
        if (this.configService.getConfigOptionByKey(ConfigKeyDictionary.GRIDIRON_GRID)?.configValue) {
            this.initGridGame();
        }
    }

    /**
     * Open results modal
     */
    private openResults(): void {
        this.dialog.open(GridResultModalComponent, {
            minHeight: '400px',
            minWidth: this.configService.isMobile ? '240px' : '500px'
        });
    }

    /**
     * Init immaculate gridiron
     */
    private initGridGame(isHistorical: boolean = false): void {
        this.gridGameService.isHistoricalGrid = isHistorical;
        this.nameMapping = GsisIdToName;
        if (!isHistorical) {
            this.gridGameService.gridDict = JSON.parse(this.configService.getConfigOptionByKey(ConfigKeyDictionary.GRIDIRON_GRID)?.configValue);
            const gridCache = JSON.parse(localStorage.getItem(LocalStorageDictionary.GRIDIRON_ITEM) || '{}');
            if (JSON.stringify(this.gridGameService.gridDict) === JSON.stringify(gridCache.grid)) {
                this.gridGameService.guessesLeft = gridCache.guesses;
                this.gridGameService.gridResults = gridCache.results;
                this.gridGameService.alreadyUsedPlayers = gridCache.alreadyUsedPlayers || [];
            } else {
                localStorage.removeItem(LocalStorageDictionary.GRIDIRON_ITEM)
            }
        }
        this.gridGameService.calculateTotalSelections();
        this.gridGameService.status = Status.DONE;
        if (this.gridGameService.guessesLeft === 9) {
            this.openHowToPlay()
        }
        if (this.gridGameService.gridDict['event']) {
            this.gridGameService.loadLeaderboard();
        }
    }

    /**
     * Return string for team img
     * @param row category object
     */
    getTeamImg(row: any): string {
        switch (row.type) {
            case 'college':
                return this.collegeImgURL.replace(this.TEAM_ACC_PLACEHOLDER, this.gridGameService.collegeLogoMap[row?.value])
            default:
                return this.teamImgURL.replace(this.TEAM_ACC_PLACEHOLDER, row?.value)
        }
    }

    /**
     * Open player search for grid
     * @param x cell x int
     * @param y cell y int
     */
    openPlayerSearch(x: number, y: number): void {
        this.dialog.open(SearchGridPlayerModal
            , {
                minWidth: this.configService.isMobile ? '200px' : '500px',
                data: {
                    coords: [x, y]
                }
            }
        );
    }

    /**
     * Open twitter account
     */
    openTwitter(): void {
        window.open('https://twitter.com/GridironTrivia', '_blank');
    }

    /**
     * handles giving up on a grid
     */
    giveUp(): void {
        this.gridGameService.guessesLeft = 0;
        this.gridGameService.validateGridSelection$.next();
    }

    /**
     * Retuns display name for award acc
     * @param award category string
     */
    getAwardDisplay(award: string): string {
        switch (award) {
            case 'roty':
                return 'ROTY';
            case 's_mvp':
                return 'SB MVP';
            default:
                return 'MVP';
        }
    }

    /**
     * Return the season or game text string
     * @param stat string of stat
     */
    getStatScopeString(stat: string): string {
        if (['top10Pick', '1stRdPick', 'over100Pick'].includes(stat)) return '';
        if (this.seasonStats.includes(stat)) {
            return !this.configService.isMobile ? 'in a season' : 'Season'
        }
        if (stat === 'only1Team') {
            return 'in career';
        }
        return !this.configService.isMobile ? 'in one game' : 'in 1 game'
    }

    /**
     * Get number string for stat
     * @param stat string stat
     */
    getStatThresholdDisplay(stat: string): string {
        if (stat.includes('1000')) {
            return '1000+';
        } else if (stat.includes('4000')) {
            return '4000+';
        } else if (stat == '3Pass1RushG') {
            return '3+/1+';
        } else if (stat == 'only1Team') {
            return '1';
        } else if (stat == 'top10Pick') {
            return 'Top 10';
        } else if (stat == '1stRdPick') {
            return '1st Rd';
        } else if (stat == '80Rush200PassG') {
            return '50+/200+';
        } else if (stat == '50Rush200PassG') {
            return '50+/200+';
        } else if (stat.includes('300')) {
            return '300+';
        } else if (stat.includes('200')) {
            return '200+';
        } else if (stat.includes('100')) {
            return '100+';
        } else if (stat.includes('10')) {
            return '10+';
        } else if (stat.includes('30')) {
            return '30+';
        } else if (stat.includes('70')) {
            return '70+';
        } else if (stat.includes('80')) {
            return '80+';
        } else if (stat.includes('12')) {
            return '12+';
        } else if (stat.includes('6')) {
            return '6+';
        } else if (stat.includes('5')) {
            return '5+';
        } else if (stat.includes('4')) {
            return '4+';
        } else if (stat.includes('3')) {
            return '3+';
        } else if (stat.includes('2')) {
            return '2+';
        } else {
            return '1+'
        }
    }

    /**
     * Get stat category display name
     * @param stat string for stat category
     */
    getStatCategory(stat: string): string {
        switch (stat) {
            case 'rushTds10':
            case 'maxTdRush3':
                return this.configService.isMobile ? 'Rush Tds' : 'Rushing Tds';
            case 'recTds10':
            case 'maxTdRec3':
                return this.configService.isMobile ? 'Rec Tds' : 'Receiving Tds';
            case 'passingTds30':
            case 'maxTdPass5':
                return this.configService.isMobile ? 'Pass Tds' : 'Passing Tds';
            case 'rushYd1000':
            case 'maxYdRush200':
                return this.configService.isMobile ? 'Rush Yds' : 'Rushing Yards';
            case 'recYd1000':
            case 'maxYdRec200':
                return this.configService.isMobile ? 'Rec Yds' : 'Receiving Yards';
            case 'passYd4000':
            case 'maxYdPass300':
                return this.configService.isMobile ? 'Pass Yds' : 'Passing Yards';
            case 'rec100':
            case 'maxRec12':
                return 'Receptions';
            case 'specialTds2':
                return 'KR/PR Tds';
            case '1Pass1RecG':
                return 'Pass & Rec Tds';
            case '1Rush1RecG':
                return 'Rush & Rec Tds';
            case '3Pass1RushG':
                return 'Pass & Rush Tds';
            case '70RushRecG':
                return 'Rush & Rec Yds';
            case '4PassTds':
                return 'Pass Tds';
            case '80Rush200PassG':
            case '50Rush200PassG':
                return 'Rush & Pass Yds';
            case 'defTkl100':
            case 'max10TklG':
                return 'Tackles';
            case 'defFF4':
            case 'max2FFG':
            case 'maxFFG':
                return 'Forced Fumbles';
            case 'defSacks10':
            case 'max2SacksG':
                return 'Sacks (Def)';
            case 'defInts6':
            case 'max2IntsG':
            case 'maxIntsG':
                return 'Int Caught';
            case 'maxDefTdG':
            case 'defTds2':
            case 'max2defTd':
                return 'Def Tds';
            case 'defSafe1':
                return 'Safeties (Def)';
            case '1Sack1IntG':
                return 'Sacks & Ints';
            case 'only1Team':
                return 'NFL Team Only';
            case 'over100Pick':
            case 'top10Pick':
            case '1stRdPick':
                return 'Draft Pick';
            default:
                return this.configService.isMobile ? 'Int Thrown' : 'Ints Thrown';
        }
    }

    /**
     * Open how to play modal
     */
    openHowToPlay(): void {
        this.dialog.open(SimpleTextModalComponent
            , {
                minHeight: '350px',
                minWidth: this.configService.isMobile ? '200px' : '500px',
                data: {
                    headerText: 'How to play',
                    categoryList: this.helpBullets
                }
            }
        );
    }

    /** toggle mr unlimited mode */
    toggleUnlimitedMode(): void {
        this.gridGameService.unlimitedMode = !this.gridGameService.unlimitedMode
    }

    /**
     * Reset grid and progress
     * @param isHistorical is historical grid or not
     */
    resetGrid(isHistorical: boolean = false): void {
        localStorage.removeItem(LocalStorageDictionary.GRIDIRON_ITEM);
        this.gridGameService.guessesLeft = 9;
        this.gridGameService.gridResults = [
            [null, null, null, null],
            [null, null, null, null],
            [null, null, null, null],
            [null, null, null, null]
        ];
        this.gridGameService.alreadyUsedPlayers = [];
        this.gridGameService.globalCommonAnsMapping = [];
        this.gridGameService.globalSelectionMapping = {}
        this.initGridGame(isHistorical);
    }

    /**
     * Open up historical grids menu
     */
    openMenu(): void {
        this.menuItems = this.triviaApiService.fetchHistoricalGridirons()
    }

    /**
     * Select historical grid to play
     * @param oldGrid old grid string json
     * @param isHistorical boolean if it is historical
     */
    selectHistoricalGrid(oldGrid: any, isHistorical: boolean): void {
        this.gridGameService.gridDict = JSON.parse(oldGrid.daily_grid);
        this.resetGrid(isHistorical);
    }
}
