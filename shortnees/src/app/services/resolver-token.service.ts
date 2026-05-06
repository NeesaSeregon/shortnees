import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
    nombre: string;
    email: string;
    rol: string[];
    exp: number;
}

@Injectable({
  providedIn: 'root'
})
export class ResolverTokenService {
    private user: DecodedToken | null = null;

    constructor() {
        const token = localStorage.getItem("token");
        if (token) {
            this.setUser(token);
        }
    }

    private setUser(token: string): void {
        this.user = jwtDecode(token);
    }

    getUser(): DecodedToken | null {
        return this.user;
    }

    isLoggedIn(): boolean {
        return !!this.user; // Verifica si hay un usuario almacenado
    }

    getUsername(): string | undefined {
        return this.user?.nombre;
    }

    getRoles(): string[] | undefined {
        return this.user?.rol;
    }

    isTokenExpired(): boolean {
        const token = localStorage.getItem('token');
        if (!token) return true;
        try {
            const decoded = jwtDecode<DecodedToken>(token);
            if (!decoded.exp) return true;
            return decoded.exp * 1000 < Date.now();
        } catch {
            return true;
        }
    }
}
