import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, delay, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, User } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  private readonly _token = signal<string | null>(this.read(this.TOKEN_KEY));
  private readonly _user = signal<User | null>(this.readUser());

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());

  login(payload: LoginRequest): Observable<LoginResponse> {
    const request$ = environment.useMockApi
      ? this.mockLogin(payload)
      : this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, payload);

    return request$.pipe(tap((res) => this.saveSession(res)));
  }

  logout(): void {
    this.remove(this.TOKEN_KEY);
    this.remove(this.USER_KEY);
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this._token();
  }

  // ---------- private helpers ----------

  private saveSession(res: LoginResponse): void {
    localStorage.setItem(this.TOKEN_KEY, res.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
    this._token.set(res.token);
    this._user.set(res.user);
  }

  private mockLogin(payload: LoginRequest): Observable<LoginResponse> {
    const valid = payload.email === 'admin@test.com' && payload.password === '123456';

    if (!valid) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            error: { message: 'Invalid email or password' },
          }),
      ).pipe(delay(800));
    }

    return of({
      token: 'mock-jwt-token-123',
      user: { id: 1, name: 'Admin User', email: payload.email },
    }).pipe(delay(800));
  }

  private read(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
  }

  private remove(key: string): void {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }

  private readUser(): User | null {
    try {
      const raw = this.read(this.USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}