package br.com.tonysystems.web.repository;

import br.com.tonysystems.web.model.Material;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MaterialRepository extends JpaRepository<Material, Long> {
}
