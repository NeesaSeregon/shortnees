import { Injectable } from '@angular/core';

interface UserData {
  nombre: string;
  email: string;
  rol: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ResolverTokenService {
  private user: UserData | null = null;

  constructor() {
    const stored = localStorage.getItem('userData');
    if (stored) {
      this.user = JSON.parse(stored);
    }
  }

  getUser(): UserData | null {
    return this.user;
  }

  isLoggedIn(): boolean {
    return !!this.user;
  }

  getUsername(): string | undefined {
    return this.user?.nombre;
  }

  getRoles(): string[] | undefined {
    return this.user?.rol;
  }

  isTokenExpired(): boolean {
    const exp = localStorage.getItem('tokenExp');
    if (!exp) return true;
    return parseInt(exp) * 1000 < Date.now();
  }
}
