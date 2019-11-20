import { Component } from '@angular/core';
import { Color } from 'ng2-charts';
import { RouteInformation } from '../map/Model/RouteInformation';
import { ChartDataSets, ChartOptions, ChartType } from 'chart.js';
import { myChartOptions } from './model/myChartOptions';
import { WeatherService } from '../shared/weather.service';
import { RouteAndWeatherInformation } from '../map/Model/RouteAndWeatherInformation';

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
    this.generateLabelsForDepartureTimes();
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

  public graphRainPercentageForRoute(percentages: number[], route: RouteInformation) {
    this.setupCanvas('line', myChartOptions.upToHundred);
    this.addRainPercentages(percentages, route.name, route.color + ', 0.6)');
  }

  public graphExpectedTotalRainOnRoute(routeWeatherInfo: RouteAndWeatherInformation[], departureTime: number) {
    //this.setupCanvas('bar', myChartOptions.upToHundred);

    this.chartData = [];
    this.chartColours = [];
    this.mainChartType = 'bar';
    this.chartOptions = myChartOptions.noLabelBeginAtZero;
    this.generateLabelsForRoutes(routeWeatherInfo);


    this.displayTotalRainPerRoute(routeWeatherInfo, departureTime);
  }

  private generateLabelsForDepartureTimes() { // make dynamic
    this.chartLabels = [];
    for (let i = 0; i < 5; i++) {
      this.chartLabels.push((i * 5).toString());
    }
  }

  private generateLabelsForRoutes(routeWeatherInfo: RouteAndWeatherInformation[]) {
    this.chartLabels = [];
    routeWeatherInfo.forEach(info => {
      this.chartLabels.push(info.routeInformation.name);
    });
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
        yAxisID
      });

      const lightBlue = 'rgba(173, 216, 230, 0.8)';
      this.chartColours.push({backgroundColor: lightBlue});
    }
  }

  private addRainPercentages(percentages: number[], label?: string, colour?: string, yAxisID?: string) { // is it okay to have udnefined??
    this.chartData.push({
      data: percentages,
      label,
      type: 'line',
      yAxisID
    });
    this.chartColours.push({backgroundColor: colour});
  }

  private displayTotalRainPerRoute(routeWeatherInfo: RouteAndWeatherInformation[], departureTime: number): void {
    let totalRainForAllRoutes: number[] = [];

    routeWeatherInfo.forEach(routeAndWeather => {
      totalRainForAllRoutes.push(this.workOutTotalRainForRoute(routeAndWeather, departureTime));
    });

    this.chartData.push({
      data: totalRainForAllRoutes
    });
    this.chartColours.push({backgroundColor: 'rgba(135, 230, 140, 1)'});


  }

  private workOutTotalRainForRoute(route: RouteAndWeatherInformation, departureTime: number): number { // TODO: covnersion aint right!
    let totalRainForThisPartOfRoute = 0;

    let focusedWeatherStation = 0;
    let previousDistance = 0;

    route.routeInformation.weatherPoints.forEach(weatherPoint => {

      let distanceToNext =  weatherPoint.distance - previousDistance;
      previousDistance = weatherPoint.distance;

      let timeOfLeginSeconds = distanceToNext / WeatherService.averageWalkingDistanceMetersPerSecond;
      totalRainForThisPartOfRoute += timeOfLeginSeconds * this.mmPerHourTommPerSecond(route.rainIntensities[departureTime / 15][focusedWeatherStation]); // NOT TAKING INTO ACCOUNT PERCENTAGES YET.
      focusedWeatherStation++;
    });

    return totalRainForThisPartOfRoute;
  }

  private mmPerHourTommPerSecond(rainIntensity: number) {
    return rainIntensity / 60 / 60;
  }
}
