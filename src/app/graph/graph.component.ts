import { Component, OnInit } from '@angular/core';
import { Color } from 'ng2-charts';
import { RouteInteractive } from '../map/Model/routeInteractive';

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss']
})
export class GraphComponent implements OnInit {

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

  onChartClick(event) {
    console.log(event);
  }

  // use time taken to do time to do / rain weighting :)
  public graphRainPercentageForRoute(percentages: number[], route: RouteInteractive) {
    this.chartData.push({
      data: percentages,
      label: route.name
    });
    this.chartColours.push({backgroundColor: route.color});

    this.updateBestRoute();
  }

  private updateBestRoute(): void {
    let lowestPercentage = 100;
    let routeName: string;
    let whenShoudlLeave: string;
    let rainProbabilty: number;

    this.chartData.forEach(hello => {

      for (let i = 0; i < hello.data.length; i++) {
        rainProbabilty = hello.data[i];
        if (rainProbabilty < lowestPercentage) {
          lowestPercentage = rainProbabilty;
          routeName = hello.label;
          whenShoudlLeave = this.chartLabels[i];
        }
      }
    });

    this.bestRoute = {
      name: routeName,
      whenShouldleave: whenShoudlLeave,
      lowestPercentage
    };
  }
}
