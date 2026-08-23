<?php

namespace App\Tests\Services;

use App\Services\AcortarUrlService;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

class AcortarUrlServiceTest extends TestCase
{
    private AcortarUrlService $acortador;

    protected function setUp(): void
    {
        $this->acortador = new AcortarUrlService();
    }

    #[Test]
    public function el_enlace_lleva_el_dominio_por_delante(): void
    {
        // url_corta guarda el dominio dentro de la cadena, no solo el codigo.
        // RedireccionController cuenta con ello para buscar el enlace.
        self::assertStringStartsWith('shortns.com/', $this->acortador->crearEnlace('https://ejemplo.com'));
    }

    #[Test]
    public function el_codigo_son_8_caracteres_de_hash_mas_10_aleatorios(): void
    {
        $codigo = substr($this->acortador->crearEnlace('https://ejemplo.com'), strlen('shortns.com/'));

        self::assertSame(18, strlen($codigo));
        self::assertMatchesRegularExpression('/^[0-9a-f]{18}$/', $codigo);
    }

    #[Test]
    public function la_misma_url_no_produce_dos_veces_el_mismo_enlace(): void
    {
        // El sufijo aleatorio existe justamente para esto: si el codigo fuese
        // solo el hash, dos usuarios acortando la misma url chocarian.
        $primero = $this->acortador->crearEnlace('https://ejemplo.com');
        $segundo = $this->acortador->crearEnlace('https://ejemplo.com');

        self::assertNotSame($primero, $segundo);
    }

    #[Test]
    public function urls_distintas_comparten_el_dominio_pero_no_el_hash(): void
    {
        $uno = $this->acortador->crearEnlace('https://ejemplo.com');
        $dos = $this->acortador->crearEnlace('https://otro.com');

        $hash = fn (string $enlace): string => substr($enlace, strlen('shortns.com/'), 8);

        self::assertNotSame($hash($uno), $hash($dos));
    }
}
