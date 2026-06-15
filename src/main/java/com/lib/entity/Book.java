package com.lib.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Book {
    private Integer bookId;
    private String isbn;
    private String bookName;
    private Integer authorId;
    private Integer categoryId;
    private Integer publisherId;
    private LocalDate publishDate;
    private BigDecimal price;
    private Integer totalCount;
    private Integer availableCount;
    private String status;
}