import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TemaService {
  private temaKey = 'app-theme';

  setTheme(tema: string) {
    const classList = document.body.classList;
    classList.forEach(className => {
      if (className.startsWith('theme-')) {
        classList.remove(className);
      }
    });
    document.body.classList.add(`theme-${tema}`);
    localStorage.setItem(this.temaKey, tema);
  }

getTheme(): string {
  const savedTheme = localStorage.getItem(this.temaKey);
  return savedTheme ? savedTheme : 'light'; // Valor por defecto controlado[5][9]
}
  initTheme() {
    this.setTheme(this.getTheme());
  }
}
