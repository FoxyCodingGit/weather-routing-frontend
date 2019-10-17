import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss']
})
export class GraphComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  public chartOptions = {
    responsive: true,
    scales: {
      yAxes: [{
        ticks: {
        beginAtZero: true,
            stepValue: 5,
            steps: 20,
          max : 100,
        }
    }]
    }
  }

  public lineChartLegend = true;

  public chartData = [{ data: [0, 20, 50, 100], label: 'Account A' }];

  public chartLabels = ['5', '10', '15', '20'];

  onChartClick(event) {
    console.log(event);
  }

  public newDataPoint(dataArr = [100, 100, 100], label) {

    this.chartData.forEach((dataset, index) => {
      this.chartData[index] = Object.assign({}, this.chartData[index], {
        data: [...this.chartData[index].data, dataArr[index]]
      });
    });

    this.chartLabels = [...this.chartLabels, label];

  }

  public graphRainPercentageForRoute(percentages: number[]) {
    this.chartData.push({
      data: percentages,
      label: 'adamTestRee'
    });
  }
}
