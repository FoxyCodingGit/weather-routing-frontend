import { Component } from '@angular/core';
import { RouteInformation } from '../map/Model/RouteInformation';
import { ChartDataSets, ChartOptions, ChartType, ChartColor } from 'chart.js';
import { myChartOptions } from './model/myChartOptions';
import { WeatherService } from '../shared/weather.service';
import { RouteAndWeatherInformation } from '../map/Model/RouteAndWeatherInformation';
import { Color } from 'ng2-charts'; // whats the point of @types/chart.js??? Or this???
import { count } from 'rxjs/operators';

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

  constructor(private weatherService: WeatherService) { }

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
    let colours: Array<ChartColor> = [];

    routeWeatherInfo.forEach(routeAndWeather => {
      let rainThatWillHitPersonInmm = this.weatherService.calculateTotalExpectedRainYouAreGoingToHitBasedOnTimeTOTakeRoute(routeAndWeather, departureTime);

      let avdmmPerHourOfRoute = this.weatherService.workOutmmPerHourFromRouteDurationAndmmThatHitsPersonInThatTime(rainThatWillHitPersonInmm, routeAndWeather.routeInformation.travelTimeInSeconds)
      console.log("average mm per hour for route is :" + avdmmPerHourOfRoute);

      colours.push(this.getColourForRouteRainIntensity(avdmmPerHourOfRoute));

      totalRainForAllRoutes.push(rainThatWillHitPersonInmm);
    });

    this.chartData.push({
      data: totalRainForAllRoutes,
      backgroundColor: colours
    });
  }

  private getColourForRouteRainIntensity(rainIntensitymmPerHour: number): string {
    const VERY_LIGHT_BLUE = 'rgb(190, 230, 255)';
    const LIGHT_BLUE = 'rgb(170, 210, 240)';
    const BLUE = 'rgb(125, 165, 230)';
    const DARK_BLUE = 'rgb(75, 115, 225)';
    const OLIVE = 'rgb(125, 125, 0)';
    const YELLOW = 'rgb(255, 200, 0)';
    const ORANGE = 'rgb(255, 150, 0)';
    const RED = 'rgb(255, 0, 0)';

    if (rainIntensitymmPerHour < 0.01) {
      return VERY_LIGHT_BLUE;
    } else if (rainIntensitymmPerHour >= 0.01 && rainIntensitymmPerHour < 0.25) {
      return LIGHT_BLUE;
    } else if (rainIntensitymmPerHour >= 0.25 && rainIntensitymmPerHour < 0.5) {
      return BLUE;
    } else if (rainIntensitymmPerHour >= 0.5 && rainIntensitymmPerHour < 1) {
      return DARK_BLUE;
    } else if (rainIntensitymmPerHour >= 1 && rainIntensitymmPerHour < 2) {
      return OLIVE;
    } else if (rainIntensitymmPerHour >= 2 && rainIntensitymmPerHour < 4) {
      return YELLOW;
    } else if (rainIntensitymmPerHour >= 4 && rainIntensitymmPerHour < 8) {
      return ORANGE;
    } else {
      return RED;
    }
  }
}
