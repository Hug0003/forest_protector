// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface User {
  id: number;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api/v1';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Charger l'utilisateur depuis le localStorage au démarrage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        console.log('✅ Login réussi:', response);
        
        // Stocker le token
        localStorage.setItem('access_token', response.access_token);
        
        // Stocker l'utilisateur
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        
        // Mettre à jour le BehaviorSubject
        this.currentUserSubject.next(response.user);
      })
    );
  }

  logout(): void {
    console.log('🚪 Déconnexion');
    localStorage.removeItem('access_token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    const isAuth = !!token;
    console.log('🔍 isAuthenticated:', isAuth, 'Token:', token?.substring(0, 20) + '...');
    return isAuth;
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}