<?php

namespace App\Tests\Controller;

use App\Tests\BaseFuncional;
use PHPUnit\Framework\Attributes\Test;

/**
 * El enrutado de esta API es fragil por diseno: /{urlCorta} es un catch-all que
 * puede tapar cualquier ruta de un solo segmento. La proteccion es una priority
 * negativa, un atributo facil de borrar sin querer. Estos tests convierten esa
 * proteccion en algo que se comprueba en cada push.
 */
class RutasTest extends BaseFuncional
{
    #[Test]
    public function el_catch_all_no_tapa_a_registro(): void
    {
        $this->cliente->request('POST', '/registro', [], [], ['CONTENT_TYPE' => 'application/json'], '{}');

        // Da igual que la peticion sea invalida: lo que se comprueba es a que
        // ruta llego. Sin la priority: -100 llegaria a app_redireccion.
        self::assertSame('app_registro', $this->cliente->getRequest()->attributes->get('_route'));
    }

    #[Test]
    public function el_catch_all_no_tapa_al_login(): void
    {
        $this->cliente->request('POST', '/api/login_check', [], [], ['CONTENT_TYPE' => 'application/json'], '{}');

        self::assertNotSame('app_redireccion', $this->cliente->getRequest()->attributes->get('_route'));
    }

    #[Test]
    public function la_raiz_del_dominio_responde_200_y_no_404(): void
    {
        // Sin DefaultController, https://shortns.com/ daria 404: el catch-all
        // exige un segmento no vacio. Este controlador vivio meses solo en el
        // servidor, sin llegar nunca al repositorio.
        $this->cliente->request('GET', '/');

        self::assertResponseIsSuccessful();
    }

    #[Test]
    public function el_preflight_del_login_devuelve_las_cabeceras_CORS(): void
    {
        // El firewall json_login no llega al OPTIONS, asi que sin
        // LoginCheckController esta peticion se queda sin controlador.
        $this->cliente->request('OPTIONS', '/api/login_check', [], [], [
            'HTTP_ORIGIN' => 'https://shortnees.com',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
        ]);

        self::assertResponseIsSuccessful();
        self::assertResponseHasHeader('Access-Control-Allow-Origin');
        self::assertSame('true', $this->cliente->getResponse()->headers->get('Access-Control-Allow-Credentials'));
    }

    #[Test]
    public function un_codigo_inexistente_lleva_a_la_pagina_de_no_encontrado(): void
    {
        $this->cliente->request('GET', '/este-codigo-no-existe');

        self::assertResponseRedirects('https://shortnees.com/not-found');
    }
}
