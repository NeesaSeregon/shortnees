<?php

namespace App\Tests\Controller;

use App\Entity\Enlaces;
use App\Tests\BaseFuncional;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;

/**
 * La autorizacion de esta API tiene dos capas y conviene no confundirlas:
 *
 *  1. access_control en security.yaml exige ROLE_USER. El firewall corta antes
 *     de llegar al controlador y responde 401.
 *  2. Cada endpoint comprueba ademas que el enlace sea del usuario del JWT, y
 *     responde 404 si no lo es.
 *
 * La segunda capa existe porque la primera solo dice "eres un usuario", no
 * "eres el dueno de esto". Aqui se comprueban las dos por separado.
 */
class AutorizacionTest extends BaseFuncional
{
    /** Las rutas privadas, tal y como las cubre el access_control. */
    public static function rutasPrivadas(): iterable
    {
        yield 'estadisticas' => ['GET', '/estadisticas/%d'];
        yield 'estadisticas por pais' => ['GET', '/estadisticas_pais/%d'];
        yield 'estadisticas por fecha' => ['GET', '/estadisticas_fecha/%d'];
        yield 'estadisticas por hora' => ['GET', '/estadisticas_hora/%d'];
        yield 'estadisticas por dispositivo' => ['GET', '/estadisticas_dispositivo/%d'];
        yield 'eliminar enlace' => ['DELETE', '/eliminar-enlace/%d'];
    }

    // ---------------------------------------------- capa 1: sin autenticacion

    #[Test]
    #[DataProvider('rutasPrivadas')]
    public function sin_token_ninguna_ruta_privada_responde(string $metodo, string $plantilla): void
    {
        $enlace = $this->crearEnlace($this->crearUsuario('ana@ejemplo.com'), 'suyo');

        $this->cliente->request($metodo, sprintf($plantilla, $enlace->getId()));

        self::assertResponseStatusCodeSame(401);
    }

    #[Test]
    public function sin_token_no_se_listan_enlaces(): void
    {
        $this->cliente->request('GET', '/enlaces-usuario');

        self::assertResponseStatusCodeSame(401);
    }

    // ------------------------------------------------- capa 2: enlace ajeno

    #[Test]
    #[DataProvider('rutasPrivadas')]
    public function un_usuario_no_puede_tocar_el_enlace_de_otro(string $metodo, string $plantilla): void
    {
        $ana = $this->crearUsuario('ana@ejemplo.com');
        $bruno = $this->crearUsuario('bruno@ejemplo.com');
        $enlaceDeAna = $this->crearEnlace($ana, 'de-ana');

        $this->autenticar($bruno);
        $this->cliente->request($metodo, sprintf($plantilla, $enlaceDeAna->getId()));

        self::assertResponseStatusCodeSame(404);
    }

    #[Test]
    public function un_enlace_ajeno_es_indistinguible_de_uno_inexistente(): void
    {
        // Si el ajeno diera 403 y el inexistente 404, recorrer los ids revelaria
        // cuantos enlaces hay en el sistema y cuales existen. Los dos casos
        // tienen que responder exactamente igual, cuerpo incluido.
        $ana = $this->crearUsuario('ana@ejemplo.com');
        $bruno = $this->crearUsuario('bruno@ejemplo.com');
        $enlaceDeAna = $this->crearEnlace($ana, 'de-ana');

        $this->autenticar($bruno);

        $this->cliente->request('GET', '/estadisticas/' . $enlaceDeAna->getId());
        $ajeno = [$this->cliente->getResponse()->getStatusCode(), $this->cliente->getResponse()->getContent()];

        $this->cliente->request('GET', '/estadisticas/99999999');
        $inexistente = [$this->cliente->getResponse()->getStatusCode(), $this->cliente->getResponse()->getContent()];

        self::assertSame($ajeno, $inexistente);
    }

    #[Test]
    public function borrar_un_enlace_ajeno_no_lo_borra(): void
    {
        // El 404 podria estar puesto despues del remove(). Se comprueba el
        // efecto, no solo el codigo de respuesta.
        $ana = $this->crearUsuario('ana@ejemplo.com');
        $bruno = $this->crearUsuario('bruno@ejemplo.com');
        $enlaceDeAna = $this->crearEnlace($ana, 'de-ana');
        $id = $enlaceDeAna->getId();

        $this->autenticar($bruno);
        $this->cliente->request('DELETE', '/eliminar-enlace/' . $id);

        self::assertResponseStatusCodeSame(404);
        self::assertNotNull($this->em->getRepository(Enlaces::class)->find($id));
    }

    // ------------------------------------------------- capa 2: el propietario

    #[Test]
    public function el_propietario_si_ve_sus_estadisticas(): void
    {
        $ana = $this->crearUsuario('ana@ejemplo.com');
        $enlace = $this->crearEnlace($ana, 'de-ana');
        $this->crearEstadistica($enlace, 'ES', 'Desktop');
        $this->crearEstadistica($enlace, 'FR', 'Móvil');

        $this->autenticar($ana);
        $this->cliente->request('GET', '/estadisticas/' . $enlace->getId());

        self::assertResponseIsSuccessful();
        $cuerpo = json_decode($this->cliente->getResponse()->getContent(), true);
        self::assertSame(2, $cuerpo['numeroClicks']);
    }

    #[Test]
    public function las_estadisticas_no_exponen_ninguna_IP(): void
    {
        // La columna ip_usuario se elimino a proposito (RGPD art. 5.1.c). Este
        // test evita que vuelva por la puerta de atras en un futuro cambio.
        $ana = $this->crearUsuario('ana@ejemplo.com');
        $enlace = $this->crearEnlace($ana, 'de-ana');
        $this->crearEstadistica($enlace);

        $this->autenticar($ana);
        $this->cliente->request('GET', '/estadisticas/' . $enlace->getId());

        $detalle = json_decode($this->cliente->getResponse()->getContent(), true)['detalles'][0];

        self::assertSame(['id', 'fecha_click', 'ubicacion', 'dispositivo'], array_keys($detalle));
    }

    #[Test]
    public function el_propietario_borra_su_enlace_y_sus_estadisticas(): void
    {
        $ana = $this->crearUsuario('ana@ejemplo.com');
        $enlace = $this->crearEnlace($ana, 'de-ana');
        $this->crearEstadistica($enlace);
        $id = $enlace->getId();

        $this->autenticar($ana);
        $this->cliente->request('DELETE', '/eliminar-enlace/' . $id);

        self::assertResponseIsSuccessful();
        self::assertNull($this->em->getRepository(Enlaces::class)->find($id));
    }

    #[Test]
    public function cada_usuario_solo_ve_sus_propios_enlaces(): void
    {
        $ana = $this->crearUsuario('ana@ejemplo.com');
        $bruno = $this->crearUsuario('bruno@ejemplo.com');
        $this->crearEnlace($ana, 'de-ana-uno');
        $this->crearEnlace($ana, 'de-ana-dos');
        $this->crearEnlace($bruno, 'de-bruno');

        $this->olvidarEntidadesEnMemoria();
        $this->autenticar($ana);
        $this->cliente->request('GET', '/enlaces-usuario');

        $enlaces = json_decode($this->cliente->getResponse()->getContent(), true);
        $urls = array_map(fn (array $e): string => $e['urlCorta'], $enlaces);
        sort($urls);

        self::assertCount(2, $enlaces);
        self::assertSame(['shortns.com/de-ana-dos', 'shortns.com/de-ana-uno'], $urls);
    }
}
