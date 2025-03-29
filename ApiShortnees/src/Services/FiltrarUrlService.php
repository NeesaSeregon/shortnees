<?php
namespace App\Services;
use App\Entity\Enlaces;
use App\Repository\EnlacesRepository;

class FiltrarUrlService {
const PROTOCOLO = 'https://';
private $repositorio;
    
    public function __construct(EnlacesRepository $repositorio){
        $this->repositorio = $repositorio;
    }
    public function verificarProtocolo($urlOriginal) {
        if (substr($urlOriginal, 0, 8) == self::PROTOCOLO){
            return true;
        }else{
            return false;
        }
    }
    public function limpiarCadena($url){
        return trim($url);
    }
    public function comprobarExistencia ($url) {
        if ($this->repositorio->findOneByUrlOriginal($url) == null){
            //no existe, crealo
            return false;
        }else{
            return true;
        }
    }
    public function evitarColisionUrlCorta ($urlCorta) {
        if ($this->repositorio->findOneByUrlcorta($urlCorta) == null){
            //esta libre
            return false;
        }else{
            return true;
        }
    }
    function esUrlAccesible($url) {
        $headers = @get_headers($url);
        return is_array($headers) && strpos($headers[0], '200') !== false;
    }
    
}