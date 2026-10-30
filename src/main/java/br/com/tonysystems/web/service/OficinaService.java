package br.com.tonysystems.web.service;

import br.com.tonysystems.web.controller.ApiDtos.*;
import br.com.tonysystems.web.model.*;
import br.com.tonysystems.web.repository.*;
import br.com.tonysystems.web.regra.*;
import tonysystems.service.ClienteService;
import java.util.ArrayList;
import java.util.Map;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class OficinaService {
    private final ClienteService clienteRegras = new ClienteService();
    private final ClienteRepository clientes;
    private final TelevisaoRepository televisoes;
    private final MaterialRepository materiais;
    private final ManutencaoRepository ordens;
    private final UsoMaterialRepository itens;
    private final PagamentoRepository pagamentos;

    public OficinaService(ClienteRepository clientes, TelevisaoRepository televisoes,
            MaterialRepository materiais, ManutencaoRepository ordens,
            UsoMaterialRepository itens, PagamentoRepository pagamentos) {
        this.clientes = clientes;
        this.televisoes = televisoes;
        this.materiais = materiais;
        this.ordens = ordens;
        this.itens = itens;
        this.pagamentos = pagamentos;
    }

    @Transactional(readOnly = true)
    public DadosView consultarDados() {
        return new DadosView(
            clientes.findAll().stream().map(c -> new ClienteView(c.id, c.nome, formatarCpf(c.cpf),
                formatarTelefone(c.telefone), c.endereco)).toList(),
            televisoes.findAll().stream().map(t -> new TelevisaoView(t.id, t.cliente.id,
                t.modelo, t.marca)).toList(),
            materiais.findAll().stream().map(m -> new MaterialView(m.id, m.nome, m.marca,
                m.categoria, m.preco, m.estoque)).toList(),
            ordens.findAll().stream().map(this::visaoOS).toList());
    }

    public void salvarCliente(Long id, ClienteInput input) {
        if (input == null) throw erro("Informe os dados do cliente.");
        try {
            clienteRegras.validarDados(input.nome(), input.cpf(), input.telefone(), input.endereco());
        } catch (IllegalArgumentException exception) {
            throw erro(exception.getMessage());
        }
        String cpf = digitos(input.cpf());
        String telefone = digitos(input.telefone());
        String nome = texto(input.nome(), 100, "Nome");
        String endereco = texto(input.endereco(), 200, "Endereço");
        Cliente cliente = id == null ? new Cliente() : cliente(id);
        if ((id == null || !cpf.equals(cliente.cpf)) && clientes.existsByCpf(cpf)) {
            throw conflito("CPF já cadastrado.");
        }
        if (id != null && !cpf.equals(cliente.cpf)) {
            throw erro("Não é permitido alterar o CPF de um cliente cadastrado.");
        }
        cliente.nome = nome;
        cliente.cpf = cpf;
        cliente.telefone = telefone;
        cliente.endereco = endereco;
        clientes.save(cliente);
    }

    public void excluirCliente(Long id) {
        Cliente cliente = cliente(id);
        if (televisoes.existsByCliente_Id(id)) {
            throw conflito("Este cliente possui televisão cadastrada e não pode ser excluído.");
        }
        clientes.delete(cliente);
    }

    public void salvarTelevisao(Long id, TelevisaoInput input) {
        if (input == null) throw erro("Informe os dados da televisão.");
        try {
            TelevisaoRegras.validarCadastro(input.clienteId(), input.marca(), input.modelo());
        } catch (IllegalArgumentException exception) {
            throw erro(exception.getMessage());
        }
        Cliente cliente = cliente(input.clienteId());
        Televisao tv = id == null ? new Televisao() : televisao(id);
        if (id != null && !cliente.id.equals(tv.cliente.id) && ordens.existsByTelevisao_Id(id)) {
            throw conflito("Esta televisão possui OS e deve continuar vinculada ao cliente original.");
        }
        tv.cliente = cliente;
        tv.modelo = texto(input.modelo(), 80, "Modelo");
        tv.marca = texto(input.marca(), 60, "Marca");
        televisoes.save(tv);
    }

    public void salvarMaterial(Long id, MaterialInput input) {
        if (input == null || input.preco() == null || input.estoque() == null
                || input.preco().signum() < 0 || input.preco().scale() > 2 || input.estoque() < 0) {
            throw erro("Informe preço e estoque válidos.");
        }
        if (input.preco().precision() > 12) throw erro("Preço fora do limite permitido.");
        Material material = id == null ? new Material() : material(id);
        material.nome = texto(input.nome(), 100, "Nome do material");
        material.marca = texto(input.marca(), 60, "Marca");
        material.categoria = texto(input.categoria(), 60, "Categoria");
        material.preco = input.preco();
        material.estoque = input.estoque();
        materiais.save(material);
    }

    public void excluirMaterial(Long id) {
        Material material = material(id);
        if (itens.existsByMaterial_Id(id)) {
            throw conflito("Material utilizado em uma OS não pode ser excluído.");
        }
        materiais.delete(material);
    }

    public void abrirOS(OrdemInput input) {
        if (input == null) throw erro("Informe os dados da ordem de serviço.");
        try {
            AberturaOSRegras.validarAbertura(input.tvId(), input.data(), input.problema());
        } catch (IllegalArgumentException exception) {
            throw erro(exception.getMessage());
        }
        Cliente cliente = cliente(input.clienteId());
        Televisao tv = televisao(input.tvId());
        if (!tv.cliente.id.equals(cliente.id)) {
            throw erro("A televisão selecionada não pertence ao cliente.");
        }
        Manutencao ordem = new Manutencao();
        ordem.cliente = cliente;
        ordem.televisao = tv;
        ordem.dataInicio = input.data();
        ordem.problema = texto(input.problema(), 2000, "Problema relatado");
        ordens.save(ordem);
    }

    public void adicionarMaterial(Long osId, ItemInput input) {
        if (input == null || input.qtd() == null || input.qtd() < 1) {
            throw erro("A quantidade deve ser maior que zero.");
        }
        Manutencao ordem = ordemPendente(osId);
        Material material = material(input.materialId());
        int totalJaIncluido = ordem.itens.stream()
            .filter(i -> i.material.id.equals(material.id))
            .mapToInt(i -> i.quantidade).sum();
        if ((long) totalJaIncluido + input.qtd() > material.estoque) {
            throw conflito("Estoque insuficiente para a quantidade selecionada.");
        }
        UsoMaterial uso = new UsoMaterial();
        uso.ordem = ordem;
        uso.material = material;
        uso.quantidade = input.qtd();
        uso.precoRegistrado = material.preco;
        uso.nomeRegistrado = material.nome;
        itens.save(uso);
    }

    public void removerMaterial(Long osId, Long itemId) {
        Manutencao ordem = ordemPendente(osId);
        UsoMaterial item = itens.findById(itemId)
            .orElseThrow(() -> naoEncontrado("Material utilizado não encontrado."));
        if (!item.ordem.id.equals(osId)) throw erro("Material não pertence a esta OS.");
        ordem.itens.removeIf(i -> i.id.equals(itemId));
        itens.delete(item);
    }

    public void finalizarOS(Long osId, FinalizacaoInput input) {
        Manutencao ordem = ordemPendente(osId);
        if (ordem.itens.isEmpty()) throw erro("Adicione pelo menos um material antes de finalizar.");
        if (input == null || input.pagamento() == null ||
                !Set.of("PIX", "Dinheiro", "Cartão de crédito", "Cartão de débito").contains(input.pagamento())) {
            throw erro("Selecione uma forma de pagamento válida.");
        }
        if (ordem.pagamento != null) throw conflito("Esta OS já possui pagamento.");
        List<UsoMaterial> materiaisUsados = new ArrayList<>(ordem.itens);
        Map<Long, Integer> consumo;
        try {
            consumo = FinalizacaoOSRegras.agruparMateriais(materiaisUsados);
        } catch (IllegalArgumentException | ArithmeticException exception) {
            throw erro("Quantidades dos materiais inválidas.");
        }
        for (Map.Entry<Long, Integer> entrada : consumo.entrySet()) {
            Material material = material(entrada.getKey());
            if (!FinalizacaoOSRegras.temEstoqueSuficiente(material.estoque, entrada.getValue())) {
                throw conflito("Estoque insuficiente para: " + material.nome);
            }
        }
        for (Map.Entry<Long, Integer> entrada : consumo.entrySet()) {
            Material material = material(entrada.getKey());
            material.estoque = FinalizacaoOSRegras.calcularEstoqueRestante(
                material.estoque, entrada.getValue());
        }
        BigDecimal total = FinalizacaoOSRegras.calcularTotal(materiaisUsados);
        Pagamento pagamento = new Pagamento();
        pagamento.ordem = ordem;
        pagamento.forma = input.pagamento();
        pagamento.valor = total;
        pagamento.data = LocalDate.now();
        pagamentos.save(pagamento);
        ordem.pagamento = pagamento;
        ordem.status = "CONCLUIDO";
    }

    private OrdemView visaoOS(Manutencao o) {
        List<ItemView> lista = o.itens.stream()
            .map(i -> new ItemView(i.id, i.material.id, i.nomeRegistrado,
                i.precoRegistrado, i.quantidade)).toList();
        return new OrdemView(o.id, o.cliente.id, o.televisao.id, o.dataInicio,
            o.problema, o.status, lista, o.pagamento == null ? "" : o.pagamento.forma);
    }

    private Cliente cliente(Long id) {
        if (id == null) throw erro("Selecione o cliente.");
        return clientes.findById(id).orElseThrow(() -> naoEncontrado("Cliente não encontrado."));
    }
    private Televisao televisao(Long id) {
        if (id == null) throw erro("Selecione a televisão.");
        return televisoes.findById(id).orElseThrow(() -> naoEncontrado("Televisão não encontrada."));
    }
    private Material material(Long id) {
        if (id == null) throw erro("Selecione o material.");
        return materiais.findById(id).orElseThrow(() -> naoEncontrado("Material não encontrado."));
    }
    private Manutencao ordemPendente(Long id) {
        if (id == null) throw erro("Selecione a ordem de serviço.");
        Manutencao ordem = ordens.findById(id)
            .orElseThrow(() -> naoEncontrado("Ordem de serviço não encontrada."));
        if (!"PENDENTE".equals(ordem.status)) throw conflito("Esta OS já foi concluída.");
        return ordem;
    }
    private static String digitos(String value) { return value == null ? "" : value.replaceAll("\\D", ""); }
    private static String texto(String value, int max, String campo) {
        String texto = value == null ? "" : value.trim();
        if (texto.isEmpty() || texto.length() > max) throw erro("Confira o campo: " + campo + ".");
        return texto;
    }
    private static String formatarCpf(String d) {
        return d.substring(0, 3) + "." + d.substring(3, 6) + "." + d.substring(6, 9) + "-" + d.substring(9);
    }
    private static String formatarTelefone(String d) {
        return "(" + d.substring(0, 2) + ") " + d.substring(2, 7) + "-" + d.substring(7);
    }
    private static ResponseStatusException erro(String msg) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }
    private static ResponseStatusException conflito(String msg) {
        return new ResponseStatusException(HttpStatus.CONFLICT, msg);
    }
    private static ResponseStatusException naoEncontrado(String msg) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, msg);
    }
}
