<?php
namespace App\Services;
use App\Repository\EnlacesRepository;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class FiltrarUrlService {
    const PROTOCOLO = 'https://';

    /** Segundos que se espera como maximo a que el destino conteste. */
    private const TIMEOUT = 4;

    /**
     * Muchos sitios (Wikipedia entre ellos) responden 403 al User-Agent por
     * defecto de PHP. Identificarse como un navegador evita rechazar destinos
     * perfectamente validos.
     */
    private const USER_AGENT = 'Mozilla/5.0 (compatible; Shortnees/1.0; +https://shortnees.com)';

    private $repositorio;
    private HttpClientInterface $cliente;

    public function __construct(EnlacesRepository $repositorio, HttpClientInterface $cliente){
        $this->repositorio = $repositorio;
        $this->cliente = $cliente;
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
    public function evitarColisionUrlCorta ($urlCorta) {
        if ($this->repositorio->findOneByUrlCorta($urlCorta) == null){
            //esta libre
            return false;
        }else{
            return true;
        }
    }

    /**
     * Comprueba que la URL apunta a algo que existe.
     *
     * Tres criterios, todos aprendidos de los falsos negativos de la version
     * anterior, que usaba get_headers():
     *  - se siguen las redirecciones y se mira el estado FINAL, para no rechazar
     *    dominios a pelo que redirigen (https://google.com respondia 301);
     *  - se acepta cualquier cosa por debajo de 400, no solo un 200 literal;
     *  - ante la duda, se acepta. Si el destino no responde, tarda demasiado o
     *    falla la resolucion DNS, no podemos afirmar que la URL sea mala. Un
     *    acortador que se niega a acortar una URL valida molesta mucho mas que
     *    uno que acorta una URL rota.
     */
    public function esUrlAccesible(string $url): bool
    {
        try {
            $codigo = $this->pedirCabeceras('HEAD', $url);

            // Hay servidores que no admiten HEAD. En ese caso se reintenta con
            // GET antes de dar la URL por mala.
            if (in_array($codigo, [405, 501], true)) {
                $codigo = $this->pedirCabeceras('GET', $url);
            }

            return $codigo < 400;
        } catch (\Throwable $e) {
            return true;
        }
    }

    private function pedirCabeceras(string $metodo, string $url): int
    {
        $respuesta = $this->cliente->request($metodo, $url, [
            'timeout' => self::TIMEOUT,
            'max_redirects' => 5,
            'headers' => ['User-Agent' => self::USER_AGENT],
        ]);

        // getStatusCode() espera solo a las cabeceras y no lanza ante un 4xx/5xx,
        // asi que un 404 se distingue de un fallo de transporte.
        $codigo = $respuesta->getStatusCode();
        $respuesta->cancel();

        return $codigo;
    }
}
