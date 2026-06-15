package com.lib.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.lib.entity.InviteCode;
import org.apache.ibatis.annotations.*;

@Mapper
public interface InviteCodeMapper extends BaseMapper<InviteCode> {
    @Select("SELECT * FROM invitecode WHERE code = #{code}")
    InviteCode selectByCode(@Param("code") String code);
}
