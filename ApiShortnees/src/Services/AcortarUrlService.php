<?php
namespace App\Services;

class AcortarUrlService {
    const DOMINIO = 'wbt.es/';
    public function crearEnlace($urlOriginal) {
        $hash = substr(hash('sha256', $urlOriginal), 0, 8);
        $sufijoAleatorio = bin2hex(random_bytes(5));
        $enlaceCorto = self::DOMINIO . $hash . $sufijoAleatorio;
        return $enlaceCorto;
    }
}