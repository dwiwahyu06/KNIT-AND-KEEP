package com.knit_and_keep.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name="settings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Setting {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(unique = true)
  private String keyName;

  @Column(length = 2000)
  private String value;
}

