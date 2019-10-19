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

  public chartData: { data: number[]; label: string; }[] = [];

  public chartLabels: string[] = [];

  public bestRoute: {
    name: string,
    whenShouldleave: string,
    lowestPercentage: number
  };

  constructor() { }

  ngOnInit() {
  }

  onChartClick() {
    console.log("The chart has been clicked on!");
  }

  // use time taken to do time to do / rain weighting :)
  public graphRainPercentageForRoute(percentages: number[], route: RouteInteractive) {
    this.chartData.push({
      data: percentages,
      label: route.name
    });

    for (let i = 1; i <= 5; i++) {
      this.chartLabels.push((i * 5).toString());
    }

    this.chartColours.push({backgroundColor: route.color + ', 0.6)'});

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
