import { Component, OnInit, ViewChild, Input, OnChanges } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartOptions } from 'chart.js';
import { PlayerComparisonService } from '../../services/player-comparison.service';
import { BaseComponent } from '../../base-component.abstract';
import { ConfigService } from '../../../services/init/config.service';
import { tap } from 'rxjs/operators';
import { FantasyMarket } from 'src/app/model/assets/FantasyPlayer';
import { ComparisonColorPalette } from '../../../services/utilities/color.service';
import { DisplayService } from 'src/app/services/utilities/display.service';

@Component({
  selector: 'app-trade-value-line-chart',
  templateUrl: './trade-value-line-chart.component.html',
  styleUrls: ['./trade-value-line-chart.component.css']
})
export class TradeValueLineChartComponent extends BaseComponent implements OnInit, OnChanges {

  @Input()
  selectedMarket: FantasyMarket = FantasyMarket.KeepTradeCut;

  /** all time start dates mapped to enums */
  allTimeStartDates = ["2021-04-16T12:00:00", "2022-05-02T12:00:00", "2023-02-17T12:00:00", "2023-06-03T12:00:00"]

  /** chart set up */
  @ViewChild(BaseChartDirective, { static: true }) chart: BaseChartDirective;

  /** selected filter range */
  selectedDateFilter = '3month';

  /** ng2-chart options */
  public lineChartOptions: (ChartOptions & { annotation?: any }) = {
    responsive: true,
    maintainAspectRatio: false,
    spanGaps: false,
    // animation: {
    //   duration: 0 // general animation time
    // },
    // hover: {
    //   animationDuration: 0 // duration of animations when hovering an item
    // },
    // responsiveAnimationDuration: 0, // animation duration after a resize
    // elements: {
    //   line: {
    //     tension: 0 // disables bezier curves
    //   }
    // },
    tooltips: {
      intersect: false,
      mode: 'index',
      position: 'nearest',
    },
    scales: {
      xAxes: [{
        type: 'time',
        display: true,
        gridLines: {
          display: true
        },
        scaleLabel: {
          display: true,
          labelString: 'Date',
          fontColor: '#d3d3d3'
        }
      }],
      yAxes: [{
        display: true,
        gridLines: {
          display: true
        },
        scaleLabel: {
          display: true,
          labelString: 'Trade Value',
          fontColor: '#d3d3d3'
        }
      }]
    },
    legend: {
      position: 'top',
      labels: {
        fontColor: '#d3d3d3'
      }
    },
    plugins: {
      decimation: {
        enabled: true,
        algorithm: 'lttb',
        samples: 50,
        threshold: 100
      },
      colorschemes: {
        scheme: ComparisonColorPalette,
        override: true
      }
    }
  };
  public lineChartLegend = true;
  public lineChartType = 'line';
  public lineChartPlugins = [];

  constructor(public playerComparisonService: PlayerComparisonService,
    private displayService: DisplayService,
    public configService: ConfigService) {
    super();
  }

  ngOnInit(): void {
    this.updateTable();
    this.addSubscriptions(this.playerComparisonService.updatePlayer$.subscribe((player) => {
      setTimeout(() => {
        if (this.chart && this.chart.chart) {
          for (const dataset of this.playerComparisonService.lineChartData) {
            dataset.fill = this.playerComparisonService.lineChartData.length < 4;
          }
          this.chart.chart.config.data.datasets = this.playerComparisonService.lineChartData;
          this.chart.chart.options.legend.position = 'top';
          this.chart.updateColors();
          this.chart.chart.update();
        }
      });
    }));
  }

  ngOnChanges(): void {
    this.updateTable();
  }

  /**
   * rerender chart with data
   */
  updateTable(): void {
    this.playerComparisonService.lineChartLabels = [];
    let displayDays;
    switch (this.selectedDateFilter) {
      case 'alltime':
        displayDays = this.calculateAllTime();
        break;
      case '6month':
        displayDays = 180;
        break;
      case '3month':
        displayDays = 90;
        break;
      default:
        displayDays = 30;
        break;
    }
    // make new api requests if data is toggled between all time
    if (this.selectedDateFilter === 'alltime' && !this.playerComparisonService.isAllTime) {
      this.playerComparisonService.isAllTime = true;
      this.playerComparisonService.regeneratePlayerCompData(this.selectedMarket).pipe(tap(res => console.log('player data: ', res)));
    } else if (this.selectedDateFilter !== 'alltime' && this.playerComparisonService.isAllTime) {
      this.playerComparisonService.isAllTime = false;
    }
    for (let i = 0; i < displayDays + 1; i++) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - (displayDays - i));
      this.playerComparisonService.lineChartLabels.push(this.displayService.formatDateForDisplay(yesterday.toString()));
    }
    this.playerComparisonService.refreshTable(this.selectedMarket);
  }

  /**
   * calculate all time range from today's date
   * @private
   * return difference in days
   */
  private calculateAllTime(): number {
    const oneDay = 24 * 60 * 60 * 1000;
    const firstDate = new Date();
    const secondDate = new Date(this.allTimeStartDates[this.selectedMarket]);

    return Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay)));
  }
}
