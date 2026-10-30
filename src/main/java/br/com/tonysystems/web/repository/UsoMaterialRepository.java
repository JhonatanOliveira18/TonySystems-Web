package br.com.tonysystems.web.repository;

import br.com.tonysystems.web.model.UsoMaterial;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsoMaterialRepository extends JpaRepository<UsoMaterial, Long> {
    boolean existsByMaterial_Id(Long materialId);
}
