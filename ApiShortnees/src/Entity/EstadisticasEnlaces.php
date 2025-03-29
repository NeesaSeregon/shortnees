<?php

namespace App\Entity;

use App\Repository\EstadisticasEnlacesRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: EstadisticasEnlacesRepository::class)]
class EstadisticasEnlaces
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $fecha_click = null;

    #[ORM\Column(length: 40, nullable: true)]
    private ?string $ip_usuario = null;

    #[ORM\Column(length: 150, nullable: true)]
    private ?string $ubicacion = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $dispositivo = null;

    #[ORM\ManyToOne(inversedBy: 'estadisticasEnlaces')]
    private ?Enlaces $enlace = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getFechaClick(): ?\DateTimeImmutable
    {
        return $this->fecha_click;
    }

    public function setFechaClick(\DateTimeImmutable $fecha_click): static
    {
        $this->fecha_click = $fecha_click;

        return $this;
    }

    public function getIpUsuario(): ?string
    {
        return $this->ip_usuario;
    }

    public function setIpUsuario(?string $ip_usuario): static
    {
        $this->ip_usuario = $ip_usuario;

        return $this;
    }

    public function getUbicacion(): ?string
    {
        return $this->ubicacion;
    }

    public function setUbicacion(?string $ubicacion): static
    {
        $this->ubicacion = $ubicacion;

        return $this;
    }

    public function getDispositivo(): ?string
    {
        return $this->dispositivo;
    }

    public function setDispositivo(?string $dispositivo): static
    {
        $this->dispositivo = $dispositivo;

        return $this;
    }

    public function getEnlace(): ?Enlaces
    {
        return $this->enlace;
    }

    public function setEnlace(?Enlaces $enlace): static
    {
        $this->enlace = $enlace;

        return $this;
    }
}
