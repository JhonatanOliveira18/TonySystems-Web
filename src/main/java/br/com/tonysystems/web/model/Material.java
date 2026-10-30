package br.com.tonysystems.web.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "tb_material")
public class Material {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @Version public Long versao;
    @Column(nullable = false, length = 100) public String nome;
    @Column(nullable = false, length = 60) public String marca;
    @Column(nullable = false, length = 60) public String categoria;
    @Column(nullable = false, precision = 12, scale = 2) public BigDecimal preco;
    @Column(nullable = false) public int estoque;
    public Material() { }
}
