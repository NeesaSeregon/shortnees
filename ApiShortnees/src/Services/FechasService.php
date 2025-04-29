<?php
namespace App\Services;

class FechasService {
 
    public function formatearFecha($fecha) {
        $fechaFormateada = $fecha->format('Y-m');
    return $fechaFormateada;
    }
}