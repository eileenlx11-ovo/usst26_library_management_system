package com.lib.dto;

import lombok.Data;

@Data
public class BookPageQueryDTO {
    // 分页参数
    private Integer pageNum = 1;
    private Integer pageSize = 10;

    // 查询条件
    private String bookName;     // 书名（模糊）
    private String authorName;   // 作者（模糊）
    private String isbn;         // ISBN（精确或模糊）
    private Integer categoryId;  // 分类ID（精确）
    private String status;       // 图书状态（可借/借空/下架等）
}