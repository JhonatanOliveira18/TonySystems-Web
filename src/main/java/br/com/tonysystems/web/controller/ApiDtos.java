package br.com.tonysystems.web.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class ApiDtos {
    private ApiDtos() { }

    public record ClienteInput(String nome, String cpf, String telefone, String endereco) { }
    public record TelevisaoInput(Long clienteId, String modelo, String marca) { }
    public record MaterialInput(String nome, String marca, String categoria, BigDecimal preco, Integer estoque) { }
    public record OrdemInput(Long clienteId, Long tvId, LocalDate data, String problema) { }
    public record ItemInput(Long materialId, Integer qtd) { }
    public record FinalizacaoInput(String pagamento) { }

    public record ClienteView(Long id, String nome, String cpf, String telefone, String endereco) { }
    public record TelevisaoView(Long id, Long clienteId, String modelo, String marca) { }
    public record MaterialView(Long id, String nome, String marca, String categoria, BigDecimal preco, int estoque) { }
    public record ItemView(Long id, Long materialId, String nome, BigDecimal preco, int qtd) { }
    public record OrdemView(Long id, Long clienteId, Long tvId, LocalDate data, String problema,
                            String status, List<ItemView> itens, String pagamento) { }
    public record DadosView(List<ClienteView> clientes, List<TelevisaoView> tvs,
                            List<MaterialView> materiais, List<OrdemView> ordens) { }
}
