<?php

/**
 * This file has been auto-generated
 * by the Symfony Routing Component.
 */

return [
    false, // $matchHost
    [ // $staticRoutes
        '/acortarUrl' => [[['_route' => 'acortar_url', '_controller' => 'App\\Controller\\EnlacesController::acortarUrl'], null, ['POST' => 0], null, false, false, null]],
        '/personalizarUrl' => [[['_route' => 'app_enlaces', '_controller' => 'App\\Controller\\EnlacesController::personalizarUrl'], null, ['POST' => 0], null, false, false, null]],
        '/enlaces-usuario' => [[['_route' => 'get_user_enlaces', '_controller' => 'App\\Controller\\EnlacesController::getUserEnlaces'], null, ['GET' => 0], null, false, false, null]],
        '/registro' => [[['_route' => 'app_registro', '_controller' => 'App\\Controller\\RegistroController::registro'], null, ['POST' => 0], null, false, false, null]],
        '/login' => [[['_route' => 'app_login', '_controller' => 'App\\Controller\\RegistroController::login'], null, ['POST' => 0], null, false, false, null]],
        '/session' => [[['_route' => 'app_session', '_controller' => 'App\\Controller\\RegistroController::getSessionData'], null, ['GET' => 0], null, false, false, null]],
        '/api/login_check' => [[['_route' => 'api_login_check'], null, null, null, false, false, null]],
    ],
    [ // $regexpList
        0 => '{^(?'
                .'|/_error/(\\d+)(?:\\.([^/]++))?(*:35)'
                .'|/e(?'
                    .'|liminar\\-enlace/([^/]++)(*:71)'
                    .'|stadisticas(?'
                        .'|/([^/]++)(*:101)'
                        .'|_(?'
                            .'|pais/([^/]++)(*:126)'
                            .'|fecha/([^/]++)(*:148)'
                            .'|dispositivo/([^/]++)(*:176)'
                        .')'
                    .')'
                .')'
                .'|/wbt\\.es/([^/]++)(*:204)'
            .')/?$}sDu',
    ],
    [ // $dynamicRoutes
        35 => [[['_route' => '_preview_error', '_controller' => 'error_controller::preview', '_format' => 'html'], ['code', '_format'], null, null, false, true, null]],
        71 => [[['_route' => 'eliminar_enlace', '_controller' => 'App\\Controller\\EnlacesController::eliminarEnlace'], ['id'], ['DELETE' => 0], null, false, true, null]],
        101 => [[['_route' => 'obtener_estadisticas', '_controller' => 'App\\Controller\\EstadisticasEnlacesController::obtenerEstadisticas'], ['id'], ['GET' => 0], null, false, true, null]],
        126 => [[['_route' => 'estadisticas_pais', '_controller' => 'App\\Controller\\EstadisticasEnlacesController::obtenerEstadisticasPorPais'], ['id'], ['GET' => 0], null, false, true, null]],
        148 => [[['_route' => 'estadisticas_fecha', '_controller' => 'App\\Controller\\EstadisticasEnlacesController::obtenerEstadisticasPorFecha'], ['id'], ['GET' => 0], null, false, true, null]],
        176 => [[['_route' => 'estadisticas_ispositivo', '_controller' => 'App\\Controller\\EstadisticasEnlacesController::obtenerEstadisticasPorDispositivo'], ['id'], ['GET' => 0], null, false, true, null]],
        204 => [
            [['_route' => 'app_redireccionapp_redireccion', '_controller' => 'App\\Controller\\RedireccionController::redirectToOriginalUrl'], ['urlCorta'], null, null, false, true, null],
            [null, null, null, null, false, false, 0],
        ],
    ],
    null, // $checkCondition
];
