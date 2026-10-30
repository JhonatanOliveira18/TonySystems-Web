package br.com.tonysystems.web.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:tonysystems_test;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driverClassName=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
class OficinaIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    private void enviar(String rota, String corpo) throws Exception {
        mvc.perform(post(rota).contentType(MediaType.APPLICATION_JSON).content(corpo))
           .andExpect(status().isCreated());
    }

    private JsonNode dados() throws Exception {
        String result = mvc.perform(get("/api/dados"))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return json.readTree(result);
    }

    @Test
    void fluxoCompletoComEstoqueEProtecaoContraDuplaFinalizacao() throws Exception {
        enviar("/api/clientes", """
            {"nome":"Cliente Teste","cpf":"529.982.247-25",
             "telefone":"(11) 98765-4321","endereco":"Rua Exemplo, 10"}
            """);
        long clienteId = dados().path("clientes").get(0).path("id").asLong();
        enviar("/api/televisoes", """
            {"clienteId":%d,"marca":"Samsung","modelo":"UN50AU7700"}
            """.formatted(clienteId));
        long tvId = dados().path("tvs").get(0).path("id").asLong();
        enviar("/api/materiais", """
            {"nome":"Kit LED","marca":"Samsung","categoria":"Iluminação",
             "preco":120.00,"estoque":5}
            """);
        long materialId = dados().path("materiais").get(0).path("id").asLong();
        enviar("/api/ordens", """
            {"clienteId":%d,"tvId":%d,"data":"2026-10-30",
             "problema":"Televisão liga, mas não tem imagem"}
            """.formatted(clienteId, tvId));
        long osId = dados().path("ordens").get(0).path("id").asLong();

        enviar("/api/ordens/" + osId + "/itens", """
            {"materialId":%d,"qtd":1}
            """.formatted(materialId));
        enviar("/api/ordens/" + osId + "/itens", """
            {"materialId":%d,"qtd":2}
            """.formatted(materialId));
        JsonNode osAntes = dados().path("ordens").get(0);
        org.junit.jupiter.api.Assertions.assertEquals(2, osAntes.path("itens").size());
        org.junit.jupiter.api.Assertions.assertEquals(5,
            dados().path("materiais").get(0).path("estoque").asInt());
        long itemExtra = osAntes.path("itens").get(1).path("id").asLong();
        mvc.perform(delete("/api/ordens/" + osId + "/itens/" + itemExtra))
            .andExpect(status().isNoContent());
        org.junit.jupiter.api.Assertions.assertEquals(1,
            dados().path("ordens").get(0).path("itens").size());
        mvc.perform(post("/api/ordens/" + osId + "/finalizar")
                .contentType(MediaType.APPLICATION_JSON).content("{\"pagamento\":\"PIX\"}"))
            .andExpect(status().isOk());
        JsonNode after = dados();
        org.junit.jupiter.api.Assertions.assertEquals(4, after.path("materiais").get(0).path("estoque").asInt());
        org.junit.jupiter.api.Assertions.assertEquals("CONCLUIDO", after.path("ordens").get(0).path("status").asText());
        org.junit.jupiter.api.Assertions.assertEquals("PIX", after.path("ordens").get(0).path("pagamento").asText());
        mvc.perform(post("/api/ordens/" + osId + "/finalizar")
                .contentType(MediaType.APPLICATION_JSON).content("{\"pagamento\":\"PIX\"}"))
            .andExpect(status().isConflict());
    }
}
