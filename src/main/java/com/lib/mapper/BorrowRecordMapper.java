package com.lib.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.lib.pojo.BorrowRecord;
import org.apache.ibatis.annotations.Mapper;

// @Mapper 告诉 Spring 框架：“嘿，把这个接口变成一个可以直接操作数据库的机械臂”
@Mapper
public interface BorrowRecordMapper extends BaseMapper<BorrowRecord> {
    // 里面什么都不用写！
    // 因为继承了 BaseMapper<BorrowRecord>，它已经悄悄学会了所有的增删改查基本功
}