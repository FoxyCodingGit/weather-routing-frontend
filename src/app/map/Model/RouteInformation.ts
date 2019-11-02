import { RouteInteractive } from './routeInteractive';

export class RouteInformation {

    public constructor(routeInteractive: RouteInteractive, rainIntensityInfo: number[][], rainProb: number[]) {
        this.routeInteractive = routeInteractive;
        this.rainIntensityInfo = rainIntensityInfo;
        this.rainProb = rainProb;
    }

    public routeInteractive: RouteInteractive;
    public rainIntensityInfo: number[][];
    public rainProb: number[];
}