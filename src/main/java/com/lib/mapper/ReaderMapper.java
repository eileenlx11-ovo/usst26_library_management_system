package com.lib.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.lib.entity.Reader;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface ReaderMapper extends BaseMapper<Reader> {
    @Select("SELECT * FROM reader WHERE reader_name LIKE CONCAT('%',#{kw},'%') OR phone LIKE CONCAT('%',#{kw},'%')")
    List<Reader> search(@Param("kw") String kw);

    @Select("SELECT * FROM reader WHERE reader_id = #{id}")
    Reader selectById(@Param("id") Integer id);
}
