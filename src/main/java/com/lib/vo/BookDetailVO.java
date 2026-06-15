package com.lib.vo;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class BookDetailVO {
    private Integer bookId;
    private String bookName;
    private String isbn;
    private String authorName;
    private String categoryName;
    private String publisherName;
    private LocalDate publishDate;
    private BigDecimal price;
    private Integer totalCount;
    private Integer availableCount;
    private String status;
}