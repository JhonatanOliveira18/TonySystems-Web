package br.com.tonysystems.web.repository;

import br.com.tonysystems.web.model.Televisao;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TelevisaoRepository extends JpaRepository<Televisao, Long> {
    boolean existsByCliente_Id(Long clienteId);
}
