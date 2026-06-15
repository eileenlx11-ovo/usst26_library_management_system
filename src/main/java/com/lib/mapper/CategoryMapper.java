package com.lib.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.lib.entity.Category;
import org.apache.ibatis.annotations.*;

@Mapper
public interface CategoryMapper extends BaseMapper<Category> {
    @Select("SELECT * FROM category WHERE category_name = #{categoryName}")
    Category selectByName(@Param("categoryName") String categoryName);
}
