import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserToken } from 'src/app/shared/Models/UserToken';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {

  private baseURL = 'https://localhost:44338/user'; // move this to confgi
    private currentUserSubject: BehaviorSubject<UserToken>;
    public currentUser: Observable<UserToken>;

    constructor(private http: HttpClient) {
        this.currentUserSubject = new BehaviorSubject<UserToken>(JSON.parse(localStorage.getItem('currentUser'))); // talk why used behaviour
        this.currentUser = this.currentUserSubject.asObservable();
    }

    public getAuthorisedRequestOptions() {
        const currentUser: UserToken = JSON.parse(localStorage.getItem('currentUser'));
        return {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Authorization': `Bearer ${currentUser.token}`
          })
        };
      }

    public get currentUserValue(): UserToken {
        return this.currentUserSubject.value;
    }

    public login(userId: string, password: string): Observable<UserToken> {
        return this.getUsertoken('login', userId, password);
    }

    public logout() {
        localStorage.removeItem('currentUser');
        this.currentUserSubject.next(null);
    }

    public register(userId: string, password: string) {
        return this.getUsertoken('register', userId, password);
    }

    public getUsertoken(urlAddition: string, userId: string, password: string): Observable<UserToken> {
        return this.http.post<string>(`${this.baseURL}/${urlAddition}`, {userId, password })
            .pipe(map(token => {
                const user: UserToken = {
                    userId,
                    token
                };
                localStorage.setItem('currentUser', JSON.stringify(user));
                this.currentUserSubject.next(user);
                return user;
            }));
    }
}