interface Detalles {
    id:number;
    fecha_click: string;
    ip_usuario: string;
    dispositivo: string;
    ubicacion: string; // Cambia a un tipo específico
} 
export interface Estadisticas {
    id: number;
    numeroClicks: number;
    detalles: Detalles[];
}
