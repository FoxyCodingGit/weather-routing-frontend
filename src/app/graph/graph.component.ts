import { Component } from '@angular/core';
import { Color } from 'ng2-charts';
import { RouteInteractive } from '../map/Model/routeInteractive';
import { ChartDataSets, ChartOptions, ChartType } from 'chart.js';
import { myChartOptions } from './model/myChartOptions';

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss']
})
export class GraphComponent {
  public chartData: ChartDataSets[];
  public chartLabels: string[];
  public chartColours: Color[];
  public mainChartType: ChartType;
  public chartOptions: ChartOptions;

  constructor() { }

  private setupCanvas(mainChartType: ChartType, chartOptions: ChartOptions) {
    this.chartData = [];
    this.chartColours = [];
    this.mainChartType = mainChartType;
    this.chartOptions = chartOptions;
    this.generateLabels();
  }

  public graphIntensityandProb(rainIntensities: number[][], rainProbs: number[]) {
    this.setupCanvas('bar', myChartOptions.rainIntensityAndProb);  
    this.addRainIntensities(rainIntensities, 'rainIntensity');
    this.addRainPercentages(rainProbs, undefined, 'rgba(255, 99, 132, 0.2)', 'rainProbability');
  }

  public JustIntensity(rainIntensities: number[][]) {
    this.setupCanvas('bar', myChartOptions.noLabelBeginAtZero);
    this.addRainIntensities(rainIntensities);

  }

  public graphRainPercentageForRoute(percentages: number[], route: RouteInteractive) {
    this.setupCanvas('line', myChartOptions.upToHundred);
    this.addRainPercentages(percentages, route.name, route.color + ', 0.6)')
    //this.updateBestRoute();
  }

  // public updateBestRoute(): void {
  //   let lowestPercentage = 100;
  //   let routeName: string;
  //   let whenShoudlLeave: string;
  //   let rainProbabilty: number;

  //   this.chartData.forEach(hello => {

  //     for (let i = 0; i < hello.data.length; i++) {
  //       rainProbabilty = hello.data[i];
  //       if (rainProbabilty < lowestPercentage) {
  //         lowestPercentage = rainProbabilty;
  //         routeName = hello.label;
  //         whenShoudlLeave = this.chartLabels[i];
  //       }
  //     }
  //   });

  //   this.bestRoute = {
  //     name: routeName,
  //     whenShouldleave: whenShoudlLeave,
  //     lowestPercentage
  //   };
  // }

  private generateLabels() { // make dynamic
    this.chartLabels = [];
    for (let i = 0; i < 5; i++) {
      this.chartLabels.push((i * 5).toString());
    }
  }

  private addRainIntensities(rainIntensities: number[][], yAxisID?: string) {
    let routeIntensities: number[];

    for (let focusedWeatherStation = 0; focusedWeatherStation < rainIntensities[0].length; focusedWeatherStation++) {
      routeIntensities = [];
      rainIntensities.forEach(intervalIntensities => {
        routeIntensities.push(intervalIntensities[focusedWeatherStation]);
      });

      this.chartData.push({
        data: routeIntensities,
        type: 'bar',
        yAxisID: yAxisID
      });

      let lightBlue = '#ADD8E6';
      this.chartColours.push({backgroundColor: lightBlue});
    }
  }

  private addRainPercentages(percentages: number[], label?: string, colour?: string, yAxisID?: string) { // is it okay to have udnefined??
    this.chartData.push({
      data: percentages,
      label: label,
      type: 'line',
      yAxisID: yAxisID
    });
    this.chartColours.push({backgroundColor: colour});
  }
}
