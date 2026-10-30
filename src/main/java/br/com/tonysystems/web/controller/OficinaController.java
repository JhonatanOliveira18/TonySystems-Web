package br.com.tonysystems.web.controller;

import br.com.tonysystems.web.controller.ApiDtos.*;
import br.com.tonysystems.web.service.OficinaService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class OficinaController {
    private final OficinaService service;
    public OficinaController(OficinaService service) { this.service = service; }

    @GetMapping("/dados") public DadosView dados() { return service.consultarDados(); }
    @PostMapping("/clientes") @ResponseStatus(HttpStatus.CREATED)
    public void novoCliente(@RequestBody ClienteInput input) { service.salvarCliente(null, input); }
    @PutMapping("/clientes/{id}")
    public void editarCliente(@PathVariable Long id, @RequestBody ClienteInput input) { service.salvarCliente(id, input); }
    @DeleteMapping("/clientes/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluirCliente(@PathVariable Long id) { service.excluirCliente(id); }

    @PostMapping("/televisoes") @ResponseStatus(HttpStatus.CREATED)
    public void novaTv(@RequestBody TelevisaoInput input) { service.salvarTelevisao(null, input); }
    @PutMapping("/televisoes/{id}")
    public void editarTv(@PathVariable Long id, @RequestBody TelevisaoInput input) { service.salvarTelevisao(id, input); }

    @PostMapping("/materiais") @ResponseStatus(HttpStatus.CREATED)
    public void novoMaterial(@RequestBody MaterialInput input) { service.salvarMaterial(null, input); }
    @PutMapping("/materiais/{id}")
    public void editarMaterial(@PathVariable Long id, @RequestBody MaterialInput input) { service.salvarMaterial(id, input); }
    @DeleteMapping("/materiais/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluirMaterial(@PathVariable Long id) { service.excluirMaterial(id); }

    @PostMapping("/ordens") @ResponseStatus(HttpStatus.CREATED)
    public void abrir(@RequestBody OrdemInput input) { service.abrirOS(input); }
    @PostMapping("/ordens/{id}/itens") @ResponseStatus(HttpStatus.CREATED)
    public void adicionar(@PathVariable Long id, @RequestBody ItemInput input) { service.adicionarMaterial(id, input); }
    @DeleteMapping("/ordens/{id}/itens/{itemId}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remover(@PathVariable Long id, @PathVariable Long itemId) { service.removerMaterial(id, itemId); }
    @PostMapping("/ordens/{id}/finalizar")
    public void finalizar(@PathVariable Long id, @RequestBody FinalizacaoInput input) { service.finalizarOS(id, input); }
}
