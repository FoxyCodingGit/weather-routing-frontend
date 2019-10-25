import { Component, OnInit } from '@angular/core';
import { Color } from 'ng2-charts';
import { RouteInteractive } from '../map/Model/routeInteractive';

@Component({
  selector: 'app-bar-graph',
  templateUrl: './bar-graph.component.html',
  styleUrls: ['./bar-graph.component.scss']
})
export class BarGraphComponent implements OnInit {

  public chartColours: Color[] = [];

  public chartOptions = {
    responsive: true,
    scales: {
      yAxes: [{
        ticks: {
        beginAtZero: true
        }
      }]
    },
    legend: {
      display: false
    }
  };

  public chartData: { data: number[] }[] = [];

  public chartLabels: string[] = [];

  public bestRoute: {
    name: string,
    whenShouldleave: string,
    lowestPercentage: number
  };

  constructor() { }

  ngOnInit() {
  }

  public graphIntensity(rainIntensities: number[][], route: RouteInteractive) {
    // just manually do 5 mins apart and 0 - 20
    let weatherStationArray: number[];

    if (this.chartLabels.length === 0) {
      for (let i = 0; i < rainIntensities.length; i++) {
        this.chartLabels.push((i * 5).toString());
      }
    }

    for (let focusedWeatherStation = 0; focusedWeatherStation < rainIntensities[0].length; focusedWeatherStation++) {
      weatherStationArray = [];
      rainIntensities.forEach(intensitiesForIntervals => {
        weatherStationArray.push(intensitiesForIntervals[focusedWeatherStation]);
      });

      this.chartData.push({
        data: weatherStationArray
      });

      this.chartColours.push({backgroundColor: '#ADD8E6'});
    }
  }
}
