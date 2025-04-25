import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
    nombre: string;
    email:string;
    rol: string[];
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
}
