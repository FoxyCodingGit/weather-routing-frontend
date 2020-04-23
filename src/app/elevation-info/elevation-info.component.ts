import { Component, EventEmitter, Output } from '@angular/core';
import { ElevationInfo } from './Model/ElevationInfo';
import { TravelMode } from '../shared/Models/travelMode';

@Component({
  selector: 'app-elevation-info',
  templateUrl: './elevation-info.component.html',
  styleUrls: ['./elevation-info.component.scss']
})
export class ElevationInfoComponent {
  @Output() elevationChangeChecked: EventEmitter<boolean[]> = new EventEmitter();
  @Output() elevationChangeUnchecked: EventEmitter<any> = new EventEmitter();

  @Output() maxInclineChecked: EventEmitter<number> = new EventEmitter();
  @Output() maxInclineUnchecked: EventEmitter<any> = new EventEmitter();

  @Output() maxInclineOverDistanceChecked: EventEmitter<any> = new EventEmitter();
  @Output() maxInclineOverDistanceUnchecked: EventEmitter<any> = new EventEmitter();

  constructor() { }

  public elevationChangeCheckboxValue = false;
  public maxInclineCheckboxValue = false;
  public maxInclineOverDistanceCheckboxValue = false;

  public elevationInfo: ElevationInfo;
  public distance: number;
  public travelMode: TravelMode;

  public populateData(elevationInfo: ElevationInfo, distance: number, travelMode: TravelMode): void {
    this.resetcheckboxes();
    this.removeElevationGuiElements();

    this.elevationInfo = elevationInfo;
    this.distance = distance;
    this.travelMode = travelMode;
  }

  public getDescription(): string {
    if (this.travelMode == TravelMode.PEDESTRIAN) return this.workOutHikingDifficulty(this.elevationInfo.totalInclineElevationGain, this.distance) + " Walk";
    if (this.travelMode == TravelMode.BICYCLE) return this.workOutCylcingDifficultyOfGradient(this.elevationInfo.greatestInclineAngleOverDistance) + " Cycle Ride";
    if (this.travelMode == TravelMode.CAR) return this.workOutHikingDifficulty(this.elevationInfo.totalInclineElevationGain, this.distance); // do car
  }

  public workOutHikingDifficulty(elevationGain: number, distance: number) { // https://www.nps.gov/shen/planyourvisit/how-to-determine-hiking-difficulty.htm national park Service
    let rating = Math.sqrt(this.meterToFeet(elevationGain) * 2 * this.meterToMile(distance));

    if (rating < 50) return "Easy";
    if (rating < 100) return "Moderate";
    if (rating < 150) return "Moderately Strenuous";
    if (rating < 200) return "Strenuous";
    return "Very Strenuous";
  }

  public workOutCylcingDifficultyOfGradient(gradient: number): string { // http://theclimbingcyclist.com/gradients-and-cycling-an-introduction/
    if (gradient < 1) return "flat";
    if (gradient < 3) return "slightly hilly";
    if (gradient < 6) return "hilly";
    if (gradient < 9) return "very hilly";
    return "extremely hilly";
  }

  public onElevationChangeChecked(show: boolean) {
    if (show) this.elevationChangeChecked.emit(this.elevationInfo.InclinesOrDeclines);
    else this.elevationChangeUnchecked.emit();
  }

  public onMaxInclineChecked(show: boolean) {
    if (show) this.maxInclineChecked.emit(this.elevationInfo.greatestInclineStartingIndex);
    else this.maxInclineUnchecked.emit();
  }

  public onMaxInclineOverDistanceChecked(show: boolean) {
    if (show) this.maxInclineOverDistanceChecked.emit({
      startIndex: this.elevationInfo.greatestInclineDistanceOverDistanceStartingIndex,
      endIndex: this.elevationInfo.greatestInclineDistanceOverDistanceEndingIndex
    });
    else this.maxInclineOverDistanceUnchecked.emit();
    
  }

  private meterToFeet(value: number) {
    return value * 3.28084;
  }

  private meterToMile(value: number) {
    return value / 1609.344;
  }

  private resetcheckboxes() {
    this.elevationChangeCheckboxValue = false;
    this.maxInclineCheckboxValue = false;
    this.maxInclineOverDistanceCheckboxValue = false;
  }

  private removeElevationGuiElements() {
    this.elevationChangeUnchecked.emit();    
    this.maxInclineUnchecked.emit();
    this.maxInclineOverDistanceUnchecked.emit();
  }
}
