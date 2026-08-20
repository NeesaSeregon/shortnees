<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260820154851 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Elimina los enlaces de pruebas creados con el dominio antiguo wbt.es y sus estadisticas.';
    }

    public function up(Schema $schema): void
    {
        // Enlaces creados antes de disponer del dominio definitivo. Su url_corta
        // empieza por 'wbt.es/', y RedireccionController solo sabe reconstruir
        // 'shortns.com/', asi que son irresolubles: ninguno redirige a nada.
        // Primero las estadisticas, que tienen clave ajena hacia enlaces.
        $this->addSql("DELETE s FROM estadisticas_enlaces s JOIN enlaces e ON e.id = s.enlace_id WHERE e.url_corta LIKE 'wbt.es/%'");
        $this->addSql("DELETE FROM enlaces WHERE url_corta LIKE 'wbt.es/%'");
    }

    public function down(Schema $schema): void
    {
        $this->throwIrreversibleMigration('Los enlaces de pruebas con dominio wbt.es se eliminan de forma definitiva.');
    }
}
