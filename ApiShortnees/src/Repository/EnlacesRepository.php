<?php

namespace App\Repository;
use App\Entity\Enlaces;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Doctrine\ORM\EntityManagerInterface;

/**
 * @extends ServiceEntityRepository<Enlaces>
 */
class EnlacesRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Enlaces::class);
    }

    public function guardarEnlace (Enlaces $enlace, EntityManagerInterface $em): bool
    {
        try {
            $em->persist($enlace);
            $em->flush();
        } catch (\Throwable $e) {
            return false;
        }

        return true;
    }
    public function findOneByUrlCorta($url_corta): ?Enlaces
        {
            return $this->createQueryBuilder('e')
                ->andWhere('e.url_corta = :val')
                ->setParameter('val', $url_corta)
                ->getQuery()
                ->getOneOrNullResult()
            ;
    }
}
