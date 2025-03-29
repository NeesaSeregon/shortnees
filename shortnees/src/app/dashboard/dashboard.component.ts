import { Component } from '@angular/core';
import { LinkService } from '../services/link.service';
import { Links } from '../interfaces/Links';
import { Estadisticas } from '../interfaces/estadisticas';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  enlaces: Links[] = [];
  estadisticas: Estadisticas | null = null; // Cambiado a null para reflejar que es un único objeto
  urlCortaSeleccionada: String | null = null; // Cambiado a null para reflejar que es opcional
  constructor(private linkService: LinkService) { }
  
  ngOnInit(): void {
    this.loadEnlaces();
  }
  loadEnlaces(): void {
    this.linkService.getUserEnlaces().subscribe({
      next: (data: any) => {
        console.log(data)
        // Asignar directamente los datos a la propiedad enlaces
        this.enlaces = data; // No necesitas forEach si solo asignas el array
      },
      error: (error) => {
        console.error('Error al cargar los enlaces:', error);
      }
    });
  }
  eliminarEnlace(id: number) {
    this.linkService.eliminarEnlace(id).subscribe(
      response => {
        console.log('Enlace eliminado', response);
        // Actualizar la lista de enlaces o realizar otras acciones necesarias
      },
      error => {
        console.error('Error al eliminar el enlace', error);
      }
    );
  }
  verEstadisticas(id: number){
    this.linkService.obtenerEstadisticas(id).subscribe({
      next: (data: Estadisticas) => {
        console.log(data)
        data.detalles.forEach(detalle => {
          console.log(detalle.fecha_click);
          let fechaString:String = detalle.fecha_click.toString();
          detalle.fecha_click = "Fecha: "+fechaString.replace(' ', ' Hora: '); // Convierte la cadena a un objeto Date
        });
        
        this.estadisticas = data; 
        
      },
      error: (error) => {
        console.error('Error al cargar las estadisticas:', error);
      }
    });
  }
  urlSeleccionada (url:String){
    this.urlCortaSeleccionada=url;
  }
  
}
