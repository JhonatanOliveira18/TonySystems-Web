package br.com.tonysystems.web.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "tb_pagamento")
public class Pagamento {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @OneToOne(optional = false) @JoinColumn(name = "manutencao_id", nullable = false, unique = true)
    public Manutencao ordem;
    @Column(nullable = false, length = 30) public String forma;
    @Column(nullable = false, precision = 12, scale = 2) public BigDecimal valor;
    @Column(nullable = false) public LocalDate data;
    public Pagamento() { }
}
