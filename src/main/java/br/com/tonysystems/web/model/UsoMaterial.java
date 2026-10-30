package br.com.tonysystems.web.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "tb_uso_material")
public class UsoMaterial {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "manutencao_id", nullable = false) public Manutencao ordem;
    @ManyToOne(optional = false) @JoinColumn(name = "material_id", nullable = false) public Material material;
    @Column(nullable = false) public int quantidade;
    @Column(nullable = false, precision = 12, scale = 2) public BigDecimal precoRegistrado;
    @Column(nullable = false, length = 100) public String nomeRegistrado;
    public UsoMaterial() { }
}
