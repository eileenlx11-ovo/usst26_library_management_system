package com.lib.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class BookUpdateDTO {
    private Integer bookId;          // 图书ID（必填）
    private String bookName;         // 书名
    private String isbn;             // ISBN
    private String authorName;       // 作者名
    private String categoryName;     // 分类名
    private String publisherName;    // 出版社名
    private LocalDate publishDate;   // 出版日期
    private BigDecimal price;        // 价格
    private Integer totalCount;      // 总册数
    private Integer availableCount;  // 可借册数
    private String status;           // 状态
}