package com.lib.mapper;

import com.lib.entity.Category;
import org.apache.ibatis.annotations.*;

@Mapper
public interface CategoryMapper {
    @Select("SELECT * FROM category WHERE category_name = #{categoryName}")
    Category selectByName(@Param("categoryName") String categoryName);

    @Insert("INSERT INTO category (category_name, description) VALUES (#{categoryName}, #{description})")
    @Options(useGeneratedKeys = true, keyProperty = "categoryId")
    void insert(Category category);
}
