export class Alert {
    type: AlertType;
    header: string;
    message: string;
}

export enum AlertType {
    SUCCESS = "sucess",
    WARNING = "warning",
    ERROR = "error"
}