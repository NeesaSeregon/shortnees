<?php

namespace App\Entity;

use App\Repository\EnlacesRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: EnlacesRepository::class)]
class Enlaces
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;
    #[ORM\Column(length: 2100)]
    private ?string $url_original = null;
    #[ORM\Column(length: 2100)]
    private ?string $url_corta = null;
    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $fecha_creacion = null;
    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $fecha_expiracion = null;
    #[ORM\Column]
    private ?bool $personalizado = null;
    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $codigo_qr = null;
    #[ORM\ManyToOne(inversedBy: 'enlaces')]
    private ?User $usuario = null;
    /**
     * @var Collection<int, EstadisticasEnlaces>
     */
    #[ORM\OneToMany(targetEntity: EstadisticasEnlaces::class, mappedBy: 'enlace')]
    private Collection $estadisticasEnlaces;

    public function __construct()
    {
        $this->estadisticasEnlaces = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUrlOriginal(): ?string
    {
        return $this->url_original;
    }

    public function setUrlOriginal(string $url_original): static
    {
        $this->url_original = $url_original;

        return $this;
    }

    public function getUrlCorta(): ?string
    {
        return $this->url_corta;
    }

    public function setUrlCorta(string $url_corta): static
    {
        $this->url_corta = $url_corta;

        return $this;
    }

    public function getFechaCreacion(): ?\DateTimeInterface
    {
        return $this->fecha_creacion;
    }

    public function setFechaCreacion(\DateTimeInterface $fecha_creacion): static
    {
        $this->fecha_creacion = $fecha_creacion;

        return $this;
    }

    public function getFechaExpiracion(): ?\DateTimeInterface
    {
        return $this->fecha_expiracion;
    }

    public function setFechaExpiracion(\DateTimeInterface $fecha_expiracion): static
    {
        $this->fecha_expiracion = $fecha_expiracion;

        return $this;
    }

    public function isPersonalizado(): ?bool
    {
        return $this->personalizado;
    }

    public function setPersonalizado(bool $personalizado): static
    {
        $this->personalizado = $personalizado;

        return $this;
    }

    public function getCodigoQr(): ?string
    {
        return $this->codigo_qr;
    }

    public function setCodigoQr(?string $codigo_qr): static
    {
        $this->codigo_qr = $codigo_qr;

        return $this;
    }

    public function getUsuario(): ?User
    {
        return $this->usuario;
    }

    public function setUsuario(?User $usuario): static
    {
        $this->usuario = $usuario;

        return $this;
    }

    /**
     * @return Collection<int, EstadisticasEnlaces>
     */
    public function getEstadisticasEnlaces(): Collection
    {
        return $this->estadisticasEnlaces;
    }

    public function addEstadisticasEnlace(EstadisticasEnlaces $estadisticasEnlace): static
    {
        if (!$this->estadisticasEnlaces->contains($estadisticasEnlace)) {
            $this->estadisticasEnlaces->add($estadisticasEnlace);
            $estadisticasEnlace->setEnlace($this);
        }

        return $this;
    }

    public function removeEstadisticasEnlace(EstadisticasEnlaces $estadisticasEnlace): static
    {
        if ($this->estadisticasEnlaces->removeElement($estadisticasEnlace)) {
            // set the owning side to null (unless already changed)
            if ($estadisticasEnlace->getEnlace() === $this) {
                $estadisticasEnlace->setEnlace(null);
            }
        }

        return $this;
    }
}
