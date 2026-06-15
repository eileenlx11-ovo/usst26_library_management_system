package com.lib.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Reader {
    private Integer readerId;
    private String readerName;
    private String gender;
    private String phone;
    private String readerType;
    private LocalDate registerDate;
    private String status;
}