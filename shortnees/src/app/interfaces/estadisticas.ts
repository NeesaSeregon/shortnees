/** Una fila de estadisticas_enlaces, tal y como la formatea el backend. */
interface Detalles {
    id: number;
    fecha_click: string;   // 'Y-m-d H:i:s'
    dispositivo: string;
    ubicacion: string;     // nombre de pais ya traducido, o 'Desconocido'
}

/** Respuesta de GET /estadisticas/{id}: un objeto, no un array. */
export interface Estadisticas {
    id: number;
    numeroClicks: number;
    detalles: Detalles[];
}
