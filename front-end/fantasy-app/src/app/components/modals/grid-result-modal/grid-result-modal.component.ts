import { Component, OnInit } from '@angular/core';
import { GridGameService } from '../../services/grid.service';
import { MatDialog } from '@angular/material/dialog';
import { Clipboard } from '@angular/cdk/clipboard';
import { ConfigService } from 'src/app/services/init/config.service';
import { ColorService } from 'src/app/services/utilities/color.service';
import { TriviaApiService } from 'src/app/services/api/trivia/trivia-api.service';
import { SaveEventGameModal } from '../save-event-game-modal/save-event-game-modal.component';

@Component({
    selector: 'grid-result-modal',
    templateUrl: './grid-result-modal.component.html',
    styleUrls: ['./grid-result-modal.component.scss']
})
export class GridResultModalComponent implements OnInit {

    resultGrid: any[][] = [];

    /** number of correct guesses */
    score: number = 0;

    /** rarity score */
    uniScore: number = 0;

    /** puzzle number */
    puzzleNum: number;

    /** toggle stats */
    toggleAnswers: boolean = false;

    /** selected cell stat to view */
    selectedCellStat: number = -1;

    /** cell stat list */
    cellStatList: any[] = [];

    /** selected player for cell to highlight */
    cellStatSelectedPlayerId: number;

    /** probability gradient for percents */
    probGradient: string[] = [];

    /** leaderboard for events */
    leaderboard: {name: string, score: number}[] = [];

    constructor(public gridGameService: GridGameService,
        private triviaApiService: TriviaApiService,
        private colorService: ColorService,
        public dialog: MatDialog,
        public configService: ConfigService,
        public clipboard: Clipboard) { }

    ngOnInit(): void {
        this.puzzleNum = this.gridGameService.gridDict['id'];
        this.resultGrid = this.slice4x4To3x3(this.gridGameService.gridResults);
        this.uniScore = this.gridGameService.calcScoresForGrid(this.gridGameService.flattenGridToPlayerList())
        this.probGradient = this.colorService.getColorGradientArray(101, '#28283c', '#3f7bfb');
        if (this.gridGameService.gridDict['event']) {
            this.loadLeaderboard();
        }
    }

    /**
     * load event leaderboard
     */
    loadLeaderboard(): void {
        this.triviaApiService.getEventLeaderboard(this.gridGameService.gridDict['eventId']).subscribe(res => {
            const newScores = [];
            res.forEach(p => {
                const picks = p.game_json['grid'] as any[];
                const score = this.gridGameService.calcScoresForGrid(picks);
                newScores.push({name: p.name, score: Math.round(score)})
            })
            this.leaderboard = newScores.sort((b,a) => b.score - a.score);
        })
    }

    /**
    * close dialog
    */
    close(): void {
        this.dialog.closeAll();
    }

    copyResults = () =>
        this.clipboard.copy(this.formatMessage());

    /**
     * return 3 x 3 grid and emoji grid from game
     * @param matrix4x4 input grid
     */
    private slice4x4To3x3(matrix4x4: any[][]) {

        const matrix3x3 = [];

        for (let i = 1; i < 4; i++) {
            const newRow = [];
            for (let j = 1; j < 4; j++) {
                if (matrix4x4[i][j]) {
                    this.score += 1;
                }
                newRow.push(matrix4x4[i][j]);
            }
            matrix3x3.push(newRow);
        }
        return matrix3x3;
    }

    private formatMessage(isTweet: boolean = false): string {
        const newline = isTweet ? '%0A' : '\n';
        const emojis = []
        for (let j = 0; j < this.resultGrid[0].length; j++) {
            const emojiRow = [];
            for (let i = 0; i < this.resultGrid.length; i++) {
                if (this.resultGrid[i][j]) {
                    if (this.resultGrid[i][j]?.percent < 0.01) {
                        emojiRow.push('🟪');
                    } else if (this.resultGrid[i][j]?.percent < 0.05) {
                        emojiRow.push('🟨');
                    } else if (this.resultGrid[i][j]?.percent < 0.1) {
                        emojiRow.push('⬜');
                    } else if (this.resultGrid[i][j]?.percent < 0.15) {
                        emojiRow.push('🟫');
                    } else {
                        emojiRow.push('🟩')
                    }
                } else {
                    emojiRow.push('⬛')
                }
            }
            emojis.push(emojiRow.join(''))
        }
        let resultStr = `Immaculate Gridiron ${this.puzzleNum} ${this.score}/9${newline}${newline}`
        if (this.score === 9) {
            resultStr += 'IMMACULATE!' + newline
        }
        resultStr += this.uniScore + ' Rarity ';
        if (this.uniScore / this.score < 25) {
            resultStr += this.uniScore / this.score < 10 ? '💎' : '🏆'
        }
        resultStr += newline + emojis.join(newline) + `${newline}Play at 👇 ${newline}https://dynasty-daddy.com/gridiron`;
        resultStr += newline + '@nflgridirongame x @DynastyDaddyFF'
        return resultStr;
    }

    makeTweet = () =>
        window.open('https://twitter.com/share?text=' + this.formatMessage(true).replace('\n', '%0A'), '_blank')

    /**
     * Loads stats for specific cell number
     * @param i row num
     * @param j col num
     */
    openStatsForCell(i: number, j: number): void {
        this.cellStatSelectedPlayerId = this.resultGrid[j]?.[i]?.id
        const cellNum = (i * 3) + j;
        this.cellStatList = [];
        this.triviaApiService.fetchAllGridironResults(this.gridGameService.gridDict['id']).subscribe(res => {
            res.forEach(obj => {
                if (obj['cellnum'] == cellNum) {
                    obj.percent = this.gridGameService.getPercentForPlayerSelected(obj.player_id, obj['cellnum'])
                    this.cellStatList.push(obj)
                }
            })
        });
        this.cellStatList.sort((a, b) => b.guesses - a.guesses);
        this.selectedCellStat = cellNum;
    }

    /**
     * return probability color for table
     * @param prob percent
     */
    getProbColor(prob: number): string {
        return this.probGradient[Math.round(prob * 100)];
    }

    /**
     * save event game to the system
     */
    saveEventGame(): void {
        const dialogRef = this.dialog.open(SaveEventGameModal, {
          minHeight: '200px',
          minWidth: this.configService.isMobile ? '300px' : '500px',
          autoFocus: true
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result && result !== '') {
            this.triviaApiService.saveEventGame(
              this.gridGameService.gridDict['eventId'],
              result.name,
              result.eventCode,
              this.gridGameService.flattenGridToPlayerList()
            ).subscribe(
              res => {
                this.loadLeaderboard();
              }
            );
          }
        });
      }
      
}
