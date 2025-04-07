<?php

namespace App\Repository;

use App\Entity\EstadisticasEnlaces;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<EstadisticasEnlaces>
 */
class EstadisticasEnlacesRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, EstadisticasEnlaces::class);
    }

    
        /**
         * @return EstadisticasEnlaces[] Returns an array of EstadisticasEnlaces objects
         */
        public function findByExampleField($enlace_id): array
        {
            return $this->createQueryBuilder('e')
                ->andWhere('e.exampleField = :val')
                ->setParameter('val', $enlace_id)
                ->orderBy('e.id', 'ASC')
                ->setMaxResults(10)
                ->getQuery()
                ->getResult()
            ;
        }
        // Consulta con QueryBuilder
        public function findByPais($enlace_id): array {
        $queryBuilder = $this->entityManager->createQueryBuilder();
        $query = $queryBuilder
           ->select('e.ubicacion, COUNT(e.id) as totalClicks')
           ->from('App\Entity\EstadisticasEnlaces', 'e')
           ->groupBy('e.ubicacion')
           ->getQuery();
        // Ejecutar la consulta
        return $query->getResult();
        }
    //    /**
    //     * @return EstadisticasEnlaces[] Returns an array of EstadisticasEnlaces objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('e')
    //            ->andWhere('e.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('e.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?EstadisticasEnlaces
    //    {
    //        return $this->createQueryBuilder('e')
    //            ->andWhere('e.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
}
