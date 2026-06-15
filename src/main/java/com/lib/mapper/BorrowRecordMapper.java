package com.lib.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.lib.pojo.BorrowRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface BorrowRecordMapper extends BaseMapper<BorrowRecord> {

    @Select("SELECT COUNT(1) FROM reader WHERE reader_id = #{readerId}")
    int countReaderById(@Param("readerId") Integer readerId);

    @Select("SELECT reader_type FROM reader WHERE reader_id = #{readerId}")
    String selectReaderTypeById(@Param("readerId") Integer readerId);

    @Select("SELECT status FROM reader WHERE reader_id = #{readerId}")
    String selectReaderStatusById(@Param("readerId") Integer readerId);
}
