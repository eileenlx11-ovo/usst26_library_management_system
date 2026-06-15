package com.lib.mapper;

import com.lib.entity.Publisher;
import org.apache.ibatis.annotations.*;

@Mapper
public interface PublisherMapper {

    @Select("SELECT * FROM publisher WHERE publisher_name = #{publisherName}")
    Publisher selectByName(@Param("publisherName") String publisherName);

    @Insert("INSERT INTO publisher (publisher_name, address, phone) VALUES (#{publisherName}, #{address}, #{phone})")
    @Options(useGeneratedKeys = true, keyProperty = "publisherId")
    void insert(Publisher publisher);
}
