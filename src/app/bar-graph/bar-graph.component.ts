import { Component, OnInit } from '@angular/core';
import { Color } from 'ng2-charts';
import { RouteInteractive } from '../map/Model/routeInteractive';

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
    responsive: true
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

  public graphIntensity(rainIntensities: number[][], route: RouteInteractive) {
    // just manually do 5 mins apart and 0 - 20
    let weatherStationArray: number[];

    for (let i = 1; i <= rainIntensities.length; i++) {
      this.chartLabels.push((i * 5).toString());
    }

    for (let focusedWeatherStation = 0; focusedWeatherStation < rainIntensities[0].length; focusedWeatherStation++) {
      weatherStationArray = [];
      rainIntensities.forEach(intensitiesForIntervals => {
        weatherStationArray.push(intensitiesForIntervals[focusedWeatherStation]);
      });

      this.chartData.push({
        data: weatherStationArray,
        label: "AdAM"
      });
    }
  }
}
