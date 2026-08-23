<?php

namespace App\Tests\Services;

use App\Entity\Enlaces;
use App\Repository\EnlacesRepository;
use App\Services\FiltrarUrlService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpClient\Exception\TransportException;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;

/**
 * MockHttpClient sustituye a la red entera: se le dice que contestar y el test
 * es instantaneo y siempre igual. Es el equivalente exacto de lo que hace
 * provideHttpClientTesting() en los specs de Angular. Ningun test sale a
 * internet: si lo hiciera, la suite fallaria cuando el wifi va mal o cuando un
 * sitio ajeno cambia de comportamiento.
 */
class FiltrarUrlServiceTest extends TestCase
{
    private function servicio(callable|MockResponse $respuesta, ?EnlacesRepository $repositorio = null): FiltrarUrlService
    {
        return new FiltrarUrlService(
            $repositorio ?? $this->createMock(EnlacesRepository::class),
            new MockHttpClient($respuesta),
        );
    }

    // ------------------------------------------------------------- protocolo

    #[Test]
    #[DataProvider('protocolos')]
    public function solo_acepta_https(bool $esperado, string $url): void
    {
        self::assertSame($esperado, $this->servicio(new MockResponse())->verificarProtocolo($url));
    }

    public static function protocolos(): iterable
    {
        yield 'https' => [true, 'https://ejemplo.com'];
        yield 'http a secas' => [false, 'http://ejemplo.com'];
        yield 'sin protocolo' => [false, 'ejemplo.com'];
        yield 'javascript:' => [false, 'javascript:alert(1)'];
    }

    #[Test]
    public function limpia_los_espacios_de_los_extremos(): void
    {
        self::assertSame('https://ejemplo.com', $this->servicio(new MockResponse())->limpiarCadena("  https://ejemplo.com \n"));
    }

    // ------------------------------------------------------------- colisiones

    #[Test]
    public function detecta_que_una_url_corta_ya_esta_ocupada(): void
    {
        $repositorio = $this->createMock(EnlacesRepository::class);
        $repositorio->method('findOneByUrlCorta')->willReturn(new Enlaces());

        self::assertTrue($this->servicio(new MockResponse(), $repositorio)->evitarColisionUrlCorta('shortns.com/libre'));
    }

    #[Test]
    public function una_url_corta_sin_dueno_esta_libre(): void
    {
        $repositorio = $this->createMock(EnlacesRepository::class);
        $repositorio->method('findOneByUrlCorta')->willReturn(null);

        self::assertFalse($this->servicio(new MockResponse(), $repositorio)->evitarColisionUrlCorta('shortns.com/libre'));
    }

    // ----------------------------------------------------------- accesibilidad

    #[Test]
    #[DataProvider('estadosAceptados')]
    public function acepta_cualquier_estado_por_debajo_de_400(int $estado): void
    {
        // No basta con exigir un 200 literal: la version anterior con
        // get_headers() rechazaba https://google.com, que responde 301.
        $servicio = $this->servicio(new MockResponse('', ['http_code' => $estado]));

        self::assertTrue($servicio->esUrlAccesible('https://ejemplo.com'));
    }

    public static function estadosAceptados(): iterable
    {
        yield '200 OK' => [200];
        yield '204 sin contenido' => [204];
        yield '301 redireccion permanente' => [301];
        yield '302 redireccion temporal' => [302];
    }

    #[Test]
    public function rechaza_un_404(): void
    {
        self::assertFalse($this->servicio(new MockResponse('', ['http_code' => 404]))->esUrlAccesible('https://ejemplo.com/no-existe'));
    }

    #[Test]
    public function reintenta_con_GET_si_el_servidor_no_admite_HEAD(): void
    {
        $metodos = [];
        $servicio = $this->servicio(function (string $metodo) use (&$metodos): MockResponse {
            $metodos[] = $metodo;

            return count($metodos) === 1
                ? new MockResponse('', ['http_code' => 405])
                : new MockResponse('', ['http_code' => 200]);
        });

        self::assertTrue($servicio->esUrlAccesible('https://ejemplo.com'));
        self::assertSame(['HEAD', 'GET'], $metodos);
    }

    #[Test]
    public function ante_un_fallo_de_transporte_acepta(): void
    {
        // Politica deliberada: si el destino no contesta no podemos afirmar que
        // la url sea mala. Un acortador que se niega a acortar una url valida
        // molesta mucho mas que uno que acorta una url rota.
        $servicio = $this->servicio(function (): MockResponse {
            throw new TransportException('Timeout agotado');
        });

        self::assertTrue($servicio->esUrlAccesible('https://servidor-que-no-responde.example'));
    }

    #[Test]
    public function se_identifica_como_navegador_y_sigue_redirecciones(): void
    {
        // Wikipedia responde 403 al User-Agent por defecto de PHP, y hay
        // dominios que solo resuelven tras redirigir. Las dos opciones tienen
        // que viajar en la peticion.
        $opciones = [];
        $servicio = $this->servicio(function (string $m, string $u, array $o) use (&$opciones): MockResponse {
            $opciones = $o;

            return new MockResponse('', ['http_code' => 200]);
        });

        $servicio->esUrlAccesible('https://es.wikipedia.org');

        self::assertSame(5, $opciones['max_redirects']);
        // assertEquals y no assertSame: el cliente normaliza el timeout a float.
        self::assertEquals(4, $opciones['timeout']);
        self::assertStringContainsString('Mozilla/5.0', implode(' ', $opciones['headers']));
    }
}
