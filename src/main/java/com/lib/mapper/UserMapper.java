package com.lib.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.lib.entity.User;
import org.apache.ibatis.annotations.*;

@Mapper
public interface UserMapper extends BaseMapper<User> {
    @Select("SELECT * FROM user WHERE username = #{username}")
    User selectByUsername(@Param("username") String username);

    @Select("SELECT * FROM user WHERE username = #{username} AND password = #{password}")
    User findByCredentials(@Param("username") String username, @Param("password") String password);
}
