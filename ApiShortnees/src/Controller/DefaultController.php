<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Da una respuesta vacia en la raiz de shortns.com.
 *
 * Hace falta porque el catch-all /{urlCorta} de RedireccionController exige un
 * segmento no vacio: sin esta ruta, https://shortns.com/ devuelve un 404. El
 * dominio no tiene portada propia (la aplicacion vive en shortnees.com), asi
 * que un 200 sin cuerpo es la respuesta correcta.
 */
class DefaultController extends AbstractController
{
    #[Route('/', name: 'homepage', methods: ['GET'])]
    public function index(): Response
    {
        return new Response();
    }
}
