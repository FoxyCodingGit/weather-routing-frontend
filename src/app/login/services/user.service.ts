import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../user';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private baseURL = 'https://localhost:44338/routing';

  constructor(private http: HttpClient) { }

    getAll() {
        return this.http.get<User[]>(`${this.baseURL}/users`);
    }

    register(user: User) {
        return this.http.post(`${this.baseURL}/users/register`, user);
    }

    delete(id: number) {
        return this.http.delete(`${this.baseURL}/users/${id}`);
    }
}
