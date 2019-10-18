import { Component, OnInit } from '@angular/core';
import { Color } from 'ng2-charts';

@Component({
  selector: 'app-bar-graph',
  templateUrl: './bar-graph.component.html',
  styleUrls: ['./bar-graph.component.scss']
})
export class BarGraphComponent implements OnInit {

  public chartColours: Color[] = [
    {backgroundColor: 'rgba(0, 255, 0, 0.1)'}
  ];

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
  };

  public lineChartLegend = true;

  public chartData = [{ data: [100, 100, 80, 100, 80], label: 'Example' }];

  public chartLabels = ['0', '5', '10', '15', '20'];

  public bestRoute: {
    name: string,
    whenShouldleave: string,
    lowestPercentage: number
  };

  constructor() { }

  ngOnInit() {
  }

  public graphIntensity() {
    console.log("potato");
  }

}
