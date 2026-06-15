package com.lib.mapper;

import com.lib.entity.Author;
import org.apache.ibatis.annotations.*;

@Mapper
public interface AuthorMapper {

    @Select("SELECT * FROM author WHERE author_name = #{authorName}")
    Author selectByName(@Param("authorName") String authorName);

    @Insert("INSERT INTO author (author_name, country, introduction) VALUES (#{authorName}, #{country}, #{introduction})")
    @Options(useGeneratedKeys = true, keyProperty = "authorId")
    void insert(Author author);
}
