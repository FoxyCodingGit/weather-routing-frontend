import { Component, OnInit } from '@angular/core';
import { Color } from 'ng2-charts';

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss']
})
export class GraphComponent implements OnInit {

    public chartColours: Color[] = [
    {backgroundColor: 'rgba(0, 255, 0, 0.1)'}
  ];

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



  public graphRainPercentageForRoute(percentages: number[]) {
    this.chartData.push({
      data: percentages,
      label: 'adamTestRee'
    });
    this.chartColours.push({backgroundColor: 'rgba(' + randomIntFromInterval(0, 255) + ', ' + randomIntFromInterval(0, 255) +
    ', ' + randomIntFromInterval(0, 255) + ', 0.1)'});
  }
}

function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
