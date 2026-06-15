package com.lib.vo;

import lombok.Data;

@Data
public class BookVO {
    private Integer bookId;
    private String bookName;
    private String authorName;
    private String isbn;
    private String publisherName;
    private String categoryName;
    private Integer totalCount;      // 总库存
    private Integer availableCount;  // 可借库存
    private String status;           // 状态（可借/借空/下架）
}