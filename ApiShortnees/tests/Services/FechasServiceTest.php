<?php

namespace App\Tests\Services;

use App\Services\FechasService;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

class FechasServiceTest extends TestCase
{
    #[Test]
    public function agrupa_por_ano_y_mes(): void
    {
        // El front espera exactamente 'Y-m': es la etiqueta del eje de la
        // grafica por fecha, y EstadisticasFecha.name se tipa como cadena.
        $formateada = (new FechasService())->formatearFecha(new \DateTimeImmutable('2026-08-23 17:45:00'));

        self::assertSame('2026-08', $formateada);
    }

    #[Test]
    public function el_mes_va_con_cero_delante(): void
    {
        // Sin el cero, ordenar las claves alfabeticamente pondria 2026-10 antes
        // que 2026-2 y la grafica saldria desordenada.
        self::assertSame('2026-02', (new FechasService())->formatearFecha(new \DateTimeImmutable('2026-02-01')));
    }
}
