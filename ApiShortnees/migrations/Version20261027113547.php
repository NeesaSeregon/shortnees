<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Tabla de solicitudes de recuperacion de contrasena (reset-password-bundle).
 *
 * Solo anade: no toca ninguna tabla existente ni ningun dato. Guarda el
 * selector en claro y el verificador hasheado, nunca el token completo.
 *
 * La clave foranea lleva ON DELETE CASCADE, a diferencia de las de enlaces y
 * estadisticas_enlaces: asi esta tabla no se convierte en un obstaculo mas al
 * borrar un usuario.
 */
final class Version20261027113547 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Crea reset_password_request para la recuperacion de contrasena.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE reset_password_request (id INT AUTO_INCREMENT NOT NULL, selector VARCHAR(20) NOT NULL, hashed_token VARCHAR(100) NOT NULL, requested_at DATETIME NOT NULL, expires_at DATETIME NOT NULL, user_id INT NOT NULL, INDEX IDX_7CE748AA76ED395 (user_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE reset_password_request ADD CONSTRAINT FK_7CE748AA76ED395 FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE reset_password_request DROP FOREIGN KEY FK_7CE748AA76ED395');
        $this->addSql('DROP TABLE reset_password_request');
    }
}
