<?php

namespace App\Repository;

use App\Entity\EstadisticasEnlaces;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<EstadisticasEnlaces>
 *
 * Las consultas de estadisticas viven hoy en EstadisticasEnlacesController, que
 * recupera las filas del enlace con findBy() y las agrupa en PHP. Migrar esa
 * agregacion a DQL con GROUP BY esta anotado como mejora en CLAUDE.md.
 */
class EstadisticasEnlacesRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, EstadisticasEnlaces::class);
    }
}
