<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Respalda el preflight CORS de /api/login_check.
 *
 * La ruta api_login_check de config/routes.yaml declara solo el path, sin
 * controlador: funciona porque el firewall json_login de Lexik intercepta el
 * POST antes de que Symfony busque nada que ejecutar. Pero una peticion que
 * llegue al enrutado sin que el firewall la capture -el OPTIONS que el
 * navegador manda antes del login entre dominios- se queda sin controlador.
 * Esta ruta cubre ese hueco; NelmioCorsBundle pone las cabeceras.
 *
 * Ojo: son dos rutas para el mismo path. Hoy gana esta, porque el recurso de
 * controladores se carga antes que la entrada suelta de routes.yaml, y da
 * igual porque en el POST manda el firewall. Unificarlas es tarea aparte.
 */
class LoginCheckController extends AbstractController
{
    #[Route('/api/login_check', name: 'api_login_check_options', methods: ['OPTIONS', 'POST'])]
    public function options(): Response
    {
        // Respuesta vacia a proposito: solo importan las cabeceras CORS.
        return new Response();
    }
}
