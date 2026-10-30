package br.com.tonysystems.web.model;

import jakarta.persistence.*;

@Entity
@Table(name = "tb_cliente", uniqueConstraints = @UniqueConstraint(columnNames = "cpf"))
public class Cliente {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @Column(nullable = false, length = 100) public String nome;
    @Column(nullable = false, length = 11) public String cpf;
    @Column(nullable = false, length = 11) public String telefone;
    @Column(nullable = false, length = 200) public String endereco;

    public Cliente() { }
}
