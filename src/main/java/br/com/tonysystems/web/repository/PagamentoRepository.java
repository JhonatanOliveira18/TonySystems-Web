package br.com.tonysystems.web.repository;

import br.com.tonysystems.web.model.Pagamento;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PagamentoRepository extends JpaRepository<Pagamento, Long> {
}
