package com.lib.controller.systemadmin;

import com.lib.entity.User;
import com.lib.mapper.UserMapper;
import com.lib.pojo.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController("systemadminAdminController")
@RequestMapping("/systemadmin/admin")
public class AdminController {
    @Autowired private UserMapper userMapper;

    @GetMapping("/users")
    public Result<List<User>> listUsers() { return Result.success(userMapper.selectList(null)); }

    @PostMapping("/user")
    public Result<Void> addUser(@RequestBody User user) {
        user.setIsActive(true); userMapper.insert(user); return Result.success();
    }

    @PutMapping("/user")
    public Result<Void> updateUser(@RequestBody User user) {
        userMapper.updateById(user); return Result.success();
    }

    @DeleteMapping("/user/{id}")
    public Result<Void> deleteUser(@PathVariable Integer id) {
        userMapper.deleteById(id); return Result.success();
    }
}
