package br.com.tonysystems.web.repository;

import br.com.tonysystems.web.model.Manutencao;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ManutencaoRepository extends JpaRepository<Manutencao, Long> {
    boolean existsByTelevisao_Id(Long televisaoId);
}
