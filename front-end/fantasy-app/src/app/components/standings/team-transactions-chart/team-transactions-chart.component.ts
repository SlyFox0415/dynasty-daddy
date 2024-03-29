import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {BaseChartDirective, Label} from 'ng2-charts';
import {ChartDataSets, ChartOptions} from 'chart.js';
import {Color} from 'chartjs-plugin-datalabels/types/options';
import {LeagueService} from '../../../services/league.service';
import { ComparisonColorPalette } from '../../../services/utilities/color.service';

@Component({
  selector: 'app-team-transactions-chart',
  templateUrl: './team-transactions-chart.component.html',
  styleUrls: ['./team-transactions-chart.component.css']
})
export class TeamTransactionsChartComponent implements OnInit {

  /** transaction aggregate */
  @Input()
  transactionsAggregate: {};

  /** chart object */
  @ViewChild(BaseChartDirective) chart: BaseChartDirective;

  /**
   * ng2-chart options
   */
  public chartOptions: (ChartOptions & { annotation?: any }) = {
    responsive: true,
    maintainAspectRatio: false,
    tooltips: {
      intersect: false,
      mode: 'index'
    },
    title: {
      text: 'Overall Team Value'
    },
    scales: {
      ticks: {
        min: 0,
      },
      xAxes: [{
        display: true,
        gridLines: {
          display: false
        },
        scaleLabel: {
          display: true,
          labelString: 'Team',
          fontColor: '#d3d3d3'
        }
      }],
      yAxes: [{
        display: true,
        gridLines: {
          display: false
        },
        scaleLabel: {
          display: true,
          labelString: 'Transactions',
          fontColor: '#d3d3d3'
        }
      }]
    },
    plugins: {
      colorschemes: {
        scheme: ComparisonColorPalette,
        override: true
      }
    }
  };
  public chartLegend = true;
  public chartType = 'bar';
  public chartPlugins = [];
  public data: ChartDataSets[] = [];
  public dataLabels: Label[] = [];
  public chartColors: Color;

  constructor(private leagueService: LeagueService) {
  }

  ngOnInit(): void {
    this.generateDataSet();
  }

  /** generate chart dataset and format it */
  private generateDataSet(): void {
    this.data = [];
    this.dataLabels = [];
    const trades: number[] = [];
    const waiver: number[] = [];
    this.leagueService.leagueTeamDetails.map(it => it.roster.rosterId).forEach(rosterId => {
      if (this.transactionsAggregate[rosterId]) {
        trades.push(this.transactionsAggregate[rosterId].trades);
        waiver.push(this.transactionsAggregate[rosterId].actions);
        this.dataLabels.push(this.leagueService.getTeamByRosterId(rosterId).owner.teamName);
      }
    });
    this.data.push({label: 'Trades', data: trades, hoverBackgroundColor: []});
    this.data.push({label: 'Waivers', data: waiver, hoverBackgroundColor: []});
    if (this.chart && this.chart.chart) {
      this.chart.chart.data.datasets = this.data;
      this.chart.chart.data.labels = this.dataLabels;
      this.chart.chart.update();
    }
  }

}
