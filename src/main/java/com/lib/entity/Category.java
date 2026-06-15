package com.lib.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Category {
    private Integer categoryId;
    private String categoryName;
    private String description;
}