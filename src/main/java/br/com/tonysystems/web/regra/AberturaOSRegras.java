package br.com.tonysystems.web.regra;

import java.time.LocalDate;

public final class AberturaOSRegras {
    private AberturaOSRegras() { }

    public static void validarAbertura(Long televisaoId, LocalDate dataInicio, String problema) {
        if (televisaoId == null || televisaoId <= 0) {
            throw new IllegalArgumentException("Selecione uma TV!");
        }
        if (dataInicio == null) {
            throw new IllegalArgumentException("Informe a data de início!");
        }
        if (problema == null || problema.isBlank()) {
            throw new IllegalArgumentException("Informe o problema relatado!");
        }
    }
}
