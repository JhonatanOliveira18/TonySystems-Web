
package tonysystems.service;

import org.junit.Test;
import static org.junit.Assert.*;

public class ClienteServiceTest {

    @Test
    public void deveAceitarDadosValidos() {
        ClienteService service = new ClienteService();

        service.validarDados(
                "Joao Silva",
                "12345678901",
                "11999999999",
                "Rua das Flores"
        );
    }

    @Test
    public void deveRejeitarCpfInvalido() {
        ClienteService service = new ClienteService();

        try {
            service.validarDados(
                    "Joao Silva",
                    "123",
                    "11999999999",
                    "Rua das Flores"
            );

            fail("Deveria rejeitar CPF com menos de 11 digitos.");

        } catch (IllegalArgumentException e) {
            assertEquals(
                    "Informe um CPF com 11 dígitos!",
                    e.getMessage()
            );
        }
    }
}
