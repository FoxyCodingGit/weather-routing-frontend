export class Currently {
    time: number; // DONT CARE ABOUT
    summary: string;
    icon: IconType;
    nearestStormDistance: number; // DONT CARE ABOUT
    nearestStormBearing: number; // DONT CARE ABOUT
    precipIntensity: number;
    precipProbability: number;
    temperature: number;
    apparentTemperature: number;
    dewPoint: number; // DONT CARE ABOUT
    humidity: number; // DONT CARE ABOUT
    pressure: number; // DONT CARE ABOUT
    windSpeed: number;
    windGust: number;
    windBearing: number;
    cloudCover: number;
    uvIndex: number;
    visibility: number;
    ozone: number; // DONT CARE ABOUT
}

export enum IconType {
    CLEAR_DAY = 'clear-day',
    CLEAR_NIGHT = 'clear-night',
    RAIN = 'rain',
    SNOW = 'snow',
    SLEET = 'sleet',
    WIND = 'wind',
    FOG = 'fog',
    CLOUDY = 'cloudy',
    PARTLY_CLOUDY_DAY = 'partly-cloudy-day',
    PARTLY_CLOUDY_NIGHT = 'partly-cloudy-night'
}