<?php

namespace App\Tests\Services;

use App\Services\VisitanteService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

/**
 * Tests unitarios puros: no arrancan el kernel ni tocan la base de datos.
 * Extienden TestCase, no KernelTestCase, y por eso corren en milisegundos.
 */
class VisitanteServiceTest extends TestCase
{
    private VisitanteService $visitante;

    protected function setUp(): void
    {
        $this->visitante = new VisitanteService();
    }

    // ---------------------------------------------------------------- agentes

    #[Test]
    #[DataProvider('agentesAutomaticos')]
    public function reconoce_a_los_agentes_automaticos(string $userAgent): void
    {
        self::assertTrue($this->visitante->esAgenteAutomatico($userAgent));
    }

    public static function agentesAutomaticos(): iterable
    {
        yield 'vista previa de WhatsApp' => ['WhatsApp/2.23.20.0'];
        yield 'vista previa de Facebook' => ['facebookexternalhit/1.1'];
        yield 'Slack' => ['Slackbot-LinkExpanding 1.0'];
        yield 'buscador de Google' => ['Googlebot/2.1 (+http://www.google.com/bot.html)'];
        yield 'curl' => ['curl/8.4.0'];
        yield 'sin User-Agent' => [''];
    }

    #[Test]
    #[DataProvider('navegadoresReales')]
    public function no_confunde_a_un_navegador_con_un_bot(string $userAgent): void
    {
        self::assertFalse($this->visitante->esAgenteAutomatico($userAgent));
    }

    public static function navegadoresReales(): iterable
    {
        yield 'Chrome en Windows' => ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'];
        yield 'Safari en iPhone' => ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'];
        yield 'Firefox en Linux' => ['Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0'];
    }

    #[Test]
    public function un_movil_Cubot_no_es_un_bot(): void
    {
        // Por esto la lista es explicita en vez de buscar la subcadena 'bot'.
        $cubot = 'Mozilla/5.0 (Linux; Android 12; CUBOT NOTE 20) AppleWebKit/537.36 Chrome/108.0.0.0 Mobile Safari/537.36';

        self::assertFalse($this->visitante->esAgenteAutomatico($cubot));
    }

    // ----------------------------------------------------------- dispositivos

    #[Test]
    #[DataProvider('dispositivos')]
    public function clasifica_el_dispositivo(string $esperado, string $userAgent): void
    {
        self::assertSame($esperado, $this->visitante->tipoDispositivo($userAgent));
    }

    public static function dispositivos(): iterable
    {
        yield 'iPhone' => ['Móvil', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) Version/17.5 Mobile/15E148 Safari/604.1'];
        yield 'movil Android' => ['Móvil', 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36'];
        yield 'iPad' => ['Tablet', 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Safari/604.1'];
        yield 'Windows' => ['Desktop', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0 Safari/537.36'];
        yield 'sin User-Agent' => ['Desktop', ''];
    }

    #[Test]
    public function una_tablet_Android_no_cuenta_como_movil(): void
    {
        // Una tablet Android manda 'Android' pero NO 'Mobile'. Era un fallo real:
        // sin el (?!.*Mobile) todas las tablets Android salian como moviles.
        $tablet = 'Mozilla/5.0 (Linux; Android 13; SM-X710) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36';

        self::assertSame('Tablet', $this->visitante->tipoDispositivo($tablet));
    }

    // ------------------------------------------------------------------ pais

    #[Test]
    public function normaliza_el_codigo_de_pais_a_mayusculas(): void
    {
        self::assertSame('ES', $this->visitante->pais('es'));
    }

    #[Test]
    #[DataProvider('paisesSinDato')]
    public function devuelve_null_cuando_no_hay_pais_utilizable(?string $codigo): void
    {
        self::assertNull($this->visitante->pais($codigo));
    }

    public static function paisesSinDato(): iterable
    {
        yield 'Cloudflare no lo sabe' => ['XX'];
        yield 'red Tor' => ['T1'];
        yield 'cabecera ausente' => [null];
        yield 'cabecera vacia' => [''];
    }
}
