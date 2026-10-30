package br.com.tonysystems.web.regra;

public final class TelevisaoRegras {
    private TelevisaoRegras() { }

    public static void validarCadastro(Long clienteId, String marca, String modelo) {
        if (clienteId == null || clienteId <= 0) {
            throw new IllegalArgumentException("Selecione um cliente válido!");
        }
        if (marca == null || marca.isBlank() || modelo == null || modelo.isBlank()) {
            throw new IllegalArgumentException("Preencha a marca e o modelo da televisão!");
        }
    }
}
