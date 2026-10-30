package br.com.tonysystems.web.model;

import jakarta.persistence.*;

@Entity
@Table(name = "tb_televisao")
public class Televisao {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @ManyToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "cliente_id", nullable = false) public Cliente cliente;
    @Column(nullable = false, length = 80) public String modelo;
    @Column(nullable = false, length = 60) public String marca;
    public Televisao() { }
}
