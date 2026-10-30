package br.com.tonysystems.web.regra;

import br.com.tonysystems.web.model.UsoMaterial;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class FinalizacaoOSRegras {
    private FinalizacaoOSRegras() { }

    public static Map<Long, Integer> agruparMateriais(List<UsoMaterial> itens) {
        Map<Long, Integer> consumo = new HashMap<>();
        for (UsoMaterial uso : itens) {
            if (uso.material == null || uso.material.id == null || uso.quantidade <= 0) {
                throw new IllegalArgumentException("Material ou quantidade inválidos.");
            }
            consumo.merge(uso.material.id, uso.quantidade, Math::addExact);
        }
        return consumo;
    }

    public static boolean temEstoqueSuficiente(int estoque, int quantidadeSolicitada) {
        return quantidadeSolicitada > 0 && estoque >= quantidadeSolicitada;
    }

    public static int calcularEstoqueRestante(int estoque, int quantidadeUtilizada) {
        if (!temEstoqueSuficiente(estoque, quantidadeUtilizada)) {
            throw new IllegalArgumentException("Estoque insuficiente ou quantidade inválida!");
        }
        return estoque - quantidadeUtilizada;
    }

    public static BigDecimal calcularTotal(List<UsoMaterial> itens) {
        BigDecimal total = BigDecimal.ZERO;
        for (UsoMaterial uso : itens) {
            total = total.add(uso.precoRegistrado.multiply(BigDecimal.valueOf(uso.quantidade)));
        }
        return total;
    }
}
