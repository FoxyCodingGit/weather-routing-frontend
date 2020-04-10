export class HighlightState {
    location: LocationType;
    isHighlighted: boolean;
}

export enum LocationType {
    STARTING_LOCATION = "starting location",
    DESTINATION = "destination"
}