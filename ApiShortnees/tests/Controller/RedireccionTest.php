<?php

namespace App\Tests\Controller;

use App\Entity\EstadisticasEnlaces;
use App\Tests\BaseFuncional;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;

/**
 * El catch-all es la ruta mas visitada de la aplicacion y la unica que un
 * anonimo puede alcanzar. Aqui se comprueba lo que hace de verdad: llevar al
 * destino siempre, y contar el clic solo cuando procede.
 */
class RedireccionTest extends BaseFuncional
{
    private const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

    #[Test]
    public function lleva_al_destino_original(): void
    {
        $enlace = $this->crearEnlace($this->crearUsuario('ana@ejemplo.com'), 'mi-codigo', 'https://destino.example/pagina');

        $this->cliente->request('GET', '/mi-codigo', [], [], ['HTTP_USER_AGENT' => self::CHROME]);

        self::assertResponseRedirects('https://destino.example/pagina');
    }

    #[Test]
    public function una_visita_de_persona_cuenta_como_clic(): void
    {
        $enlace = $this->crearEnlace($this->crearUsuario('ana@ejemplo.com'), 'mi-codigo');

        $this->cliente->request('GET', '/mi-codigo', [], [], ['HTTP_USER_AGENT' => self::CHROME]);

        self::assertSame(1, $this->contarEstadisticasDe($enlace));
    }

    #[Test]
    #[DataProvider('agentesQueNoCuentan')]
    public function un_agente_automatico_redirige_pero_no_suma(string $userAgent): void
    {
        // Un enlace pegado en un grupo de WhatsApp generaba clics antes de que
        // nadie lo pulsara: cada cliente pide la vista previa.
        $enlace = $this->crearEnlace($this->crearUsuario('ana@ejemplo.com'), 'mi-codigo');

        $this->cliente->request('GET', '/mi-codigo', [], [], ['HTTP_USER_AGENT' => $userAgent]);

        self::assertResponseRedirects('https://ejemplo.com');
        self::assertSame(0, $this->contarEstadisticasDe($enlace));
    }

    public static function agentesQueNoCuentan(): iterable
    {
        yield 'vista previa de WhatsApp' => ['WhatsApp/2.23.20.0'];
        yield 'Googlebot' => ['Googlebot/2.1 (+http://www.google.com/bot.html)'];
        yield 'curl' => ['curl/8.4.0'];
    }

    #[Test]
    public function guarda_el_pais_que_manda_Cloudflare(): void
    {
        $enlace = $this->crearEnlace($this->crearUsuario('ana@ejemplo.com'), 'mi-codigo');

        $this->cliente->request('GET', '/mi-codigo', [], [], [
            'HTTP_USER_AGENT' => self::CHROME,
            'HTTP_CF_IPCOUNTRY' => 'es',
        ]);

        self::assertSame('ES', $this->ultimaEstadistica()->getUbicacion());
    }

    #[Test]
    public function sin_Cloudflare_el_pais_queda_vacio_pero_el_clic_se_registra(): void
    {
        // Es el modo degradado: si el DNS deja de estar proxificado, la cabecera
        // no llega. Se deja de medir el pais, pero no se pierde el clic.
        $enlace = $this->crearEnlace($this->crearUsuario('ana@ejemplo.com'), 'mi-codigo');

        $this->cliente->request('GET', '/mi-codigo', [], [], ['HTTP_USER_AGENT' => self::CHROME]);

        self::assertSame(1, $this->contarEstadisticasDe($enlace));
        self::assertNull($this->ultimaEstadistica()->getUbicacion());
    }

    #[Test]
    public function guarda_el_tipo_de_dispositivo(): void
    {
        $this->crearEnlace($this->crearUsuario('ana@ejemplo.com'), 'mi-codigo');

        $this->cliente->request('GET', '/mi-codigo', [], [], [
            'HTTP_USER_AGENT' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) Version/17.5 Mobile/15E148 Safari/604.1',
        ]);

        self::assertSame('Móvil', $this->ultimaEstadistica()->getDispositivo());
    }

    #[Test]
    public function el_codigo_se_busca_con_el_dominio_por_delante(): void
    {
        // url_corta guarda 'shortns.com/codigo', no solo 'codigo'. Si alguien
        // cambia el dominio en un sitio y no en los otros cuatro, esto avisa.
        $this->crearEnlace($this->crearUsuario('ana@ejemplo.com'), 'con-dominio', 'https://destino.example');

        $this->cliente->request('GET', '/con-dominio', [], [], ['HTTP_USER_AGENT' => self::CHROME]);

        self::assertResponseRedirects('https://destino.example');
    }

    private function ultimaEstadistica(): EstadisticasEnlaces
    {
        $this->olvidarEntidadesEnMemoria();

        return $this->em->getRepository(EstadisticasEnlaces::class)->findOneBy([], ['id' => 'DESC']);
    }
}
