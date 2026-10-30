package tonysystems.service;

public class ClienteService {
    public void validarDados(String nome, String cpf,
            String telefone, String endereco) {

        if (nome == null || nome.isBlank()
                || endereco == null || endereco.isBlank()) {
            throw new IllegalArgumentException(
                    "Preencha todos os campos obrigatórios!"
            );
        }

        if (cpf == null || cpf.replaceAll("\\D", "").length() != 11) {
            throw new IllegalArgumentException(
                    "Informe um CPF com 11 dígitos!"
            );
        }

        if (telefone == null
                || telefone.replaceAll("\\D", "").length() != 11) {
            throw new IllegalArgumentException(
                    "Informe um celular com DDD e 11 dígitos!"
            );
        }
    }

}
