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

    public function guardarEnlace (Enlaces $enlace, EntityManagerInterface $em) 
    {
        $em->persist($enlace);
        if($em->flush()){
            return true;
        }
        return false;
    }
    public function findOneByUrlOriginal($url_original): ?Enlaces
        {
            return $this->createQueryBuilder('e')
                ->andWhere('e.url_original = :val')
                ->setParameter('val', $url_original)
                ->getQuery()
                ->getOneOrNullResult()
            ;
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
        public function findOneById($id): ?Enlaces
        {
            return $this->createQueryBuilder('e')
                ->andWhere('e.id = :val')
                ->setParameter('val', $id)
                ->getQuery()
                ->getOneOrNullResult()
            ;
        }
    
    
        //    /**
    //     * @return Enlaces[] Returns an array of Enlaces objects
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

    //    public function findOneBySomeField($value): ?Enlaces
    //    {
    //        return $this->createQueryBuilder('e')
    //            ->andWhere('e.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
}
