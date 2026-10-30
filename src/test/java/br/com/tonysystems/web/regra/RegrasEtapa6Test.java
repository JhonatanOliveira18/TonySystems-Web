package br.com.tonysystems.web.regra;

import br.com.tonysystems.web.model.Material;
import br.com.tonysystems.web.model.UsoMaterial;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class RegrasEtapa6Test {
    @Test void exigeClienteEModeloNoCadastroDeTv() {
        assertThrows(IllegalArgumentException.class,
            () -> TelevisaoRegras.validarCadastro(null, "Samsung", "UN50"));
        assertThrows(IllegalArgumentException.class,
            () -> TelevisaoRegras.validarCadastro(1L, "", "UN50"));
        assertDoesNotThrow(() -> TelevisaoRegras.validarCadastro(1L, "Samsung", "UN50"));
    }

    @Test void aberturaExigeTvDataEProblema() {
        assertThrows(IllegalArgumentException.class,
            () -> AberturaOSRegras.validarAbertura(1L, null, "Falha"));
        assertThrows(IllegalArgumentException.class,
            () -> AberturaOSRegras.validarAbertura(1L, LocalDate.now(), " "));
    }

    @Test void agrupaPecasReplicadasAntesDeConsumirEstoque() {
        Material m = new Material();
        m.id = 9L;
        m.preco = new BigDecimal("25.00");
        m.estoque = 3;
        UsoMaterial a = new UsoMaterial();
        a.material = m; a.quantidade = 1; a.precoRegistrado = m.preco;
        UsoMaterial b = new UsoMaterial();
        b.material = m; b.quantidade = 2; b.precoRegistrado = m.preco;
        List<UsoMaterial> usos = List.of(a, b);
        assertEquals(Map.of(9L, 3), FinalizacaoOSRegras.agruparMateriais(usos));
        assertEquals(new BigDecimal("75.00"), FinalizacaoOSRegras.calcularTotal(usos));
        assertEquals(0, FinalizacaoOSRegras.calcularEstoqueRestante(3, 3));
        assertThrows(IllegalArgumentException.class,
            () -> FinalizacaoOSRegras.calcularEstoqueRestante(2, 3));
    }
}
