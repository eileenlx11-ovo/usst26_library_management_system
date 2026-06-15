package com.lib.controller;

import com.lib.entity.InviteCode;
import com.lib.entity.User;
import com.lib.mapper.InviteCodeMapper;
import com.lib.mapper.UserMapper;
import com.lib.pojo.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/auth")
public class AuthController {
    @Autowired private UserMapper userMapper;
    @Autowired private InviteCodeMapper inviteCodeMapper;

    /** 登录 */
    @PostMapping("/login")
    public Result<?> login(@RequestParam String username, @RequestParam String password,
                           @RequestParam(defaultValue = "") String role) {
        User user = userMapper.selectByUsername(username);
        if (user == null) return Result.error("用户名或密码错误");
        if (!user.getPassword().equals(password)) return Result.error("用户名或密码错误");
        if (role != null && !role.isEmpty() && !user.getRole().equals(role)) return Result.error("角色不匹配");
        if (user.getIsActive() != null && !user.getIsActive()) return Result.error("账号已被禁用");
        user.setLastLogin(LocalDateTime.now());
        userMapper.updateById(user);
        Map<String,Object> data = new LinkedHashMap<>();
        data.put("userId", user.getUserId());
        data.put("username", user.getUsername());
        data.put("role", user.getRole());
        data.put("readerId", user.getReaderId());
        return Result.success(data);
    }

    /** 注册 */
    @PostMapping("/register")
    public Result<?> register(@RequestParam String username, @RequestParam String password,
                              @RequestParam(defaultValue = "") String role,
                              @RequestParam(defaultValue = "") String inviteCode) {
        if (userMapper.selectByUsername(username) != null) return Result.error("用户名已存在");
        // 非读者需要邀请码
        if (!"读者".equals(role) && !"".equals(role)) {
            if (inviteCode.isEmpty()) return Result.error("管理员注册需要邀请码");
            InviteCode ic = inviteCodeMapper.selectByCode(inviteCode);
            if (ic == null || Boolean.TRUE.equals(ic.getIsUsed())) return Result.error("邀请码无效或已使用");
            if (ic.getExpireTime().isBefore(LocalDateTime.now())) return Result.error("邀请码已过期");
            if (!ic.getRole().equals(role)) return Result.error("邀请码角色不匹配");
            ic.setIsUsed(true); ic.setUsedBy(null);
            inviteCodeMapper.updateById(ic);
        }
        User u = new User();
        u.setUsername(username); u.setPassword(password);
        u.setRole(role.isEmpty() ? "读者" : role);
        u.setIsActive(true); u.setCreateTime(LocalDateTime.now());
        userMapper.insert(u);
        return Result.success("注册成功");
    }

    /** 用户列表 */
    @GetMapping("/users")
    public Result<List<User>> users() {
        return Result.success(userMapper.selectList(null));
    }
}
