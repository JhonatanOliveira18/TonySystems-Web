package br.com.tonysystems.web.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "tb_manutencao")
public class Manutencao {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @Version public Long versao;
    @ManyToOne(optional = false) @JoinColumn(name = "cliente_id", nullable = false) public Cliente cliente;
    @ManyToOne(optional = false) @JoinColumn(name = "televisao_id", nullable = false) public Televisao televisao;
    @Column(nullable = false) public LocalDate dataInicio;
    @Column(nullable = false, length = 2000) public String problema;
    @Column(nullable = false, length = 12) public String status = "PENDENTE";
    @OneToMany(mappedBy = "ordem", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("id ASC") public Set<UsoMaterial> itens = new LinkedHashSet<>();
    @OneToOne(mappedBy = "ordem", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    public Pagamento pagamento;
    public Manutencao() { }
}
