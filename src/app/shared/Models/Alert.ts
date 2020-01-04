export class Alert {
    type: AlertType;
    message: string;
}

export enum AlertType {
    SUCCESS = "sucess",
    WARNING = "warning",
    ERROR = "error"
}