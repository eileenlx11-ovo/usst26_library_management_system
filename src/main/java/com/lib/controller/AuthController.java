package com.lib.controller;

import com.lib.entity.InviteCode;
import com.lib.entity.User;
import com.lib.mapper.InviteCodeMapper;
import com.lib.mapper.UserMapper;
import com.lib.pojo.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import javax.sql.DataSource;
import java.security.MessageDigest;
import java.sql.*;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/auth")
public class AuthController {
    @Autowired private UserMapper userMapper;
    @Autowired private InviteCodeMapper inviteCodeMapper;
    @Autowired private DataSource dataSource;

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) sb.append(String.format("%02x", b));
        return sb.toString();
    }

    @PostMapping("/login")
    public Result<?> login(@RequestParam String username, @RequestParam String password,
                           @RequestParam(defaultValue = "") String role) {
        User user = userMapper.selectByUsername(username);
        if (user == null) return Result.error("用户名或密码错误");
        if (!password.equals(user.getPassword())) return Result.error("用户名或密码错误");
        if (role != null && !role.isEmpty() && !user.getRole().equals(role)) return Result.error("角色不匹配");
        if (user.getIsActive() != null && !user.getIsActive()) return Result.error("账号已被注销");
        user.setLastLogin(LocalDateTime.now()); userMapper.updateById(user);
        Map<String,Object> data = new LinkedHashMap<>();
        data.put("userId", user.getUserId()); data.put("username", user.getUsername());
        data.put("role", user.getRole()); data.put("readerId", user.getReaderId());
        return Result.success(data);
    }

    @PostMapping("/register")
    public Result<?> register(@RequestParam String username, @RequestParam String password,
                              @RequestParam(defaultValue = "") String role,
                              @RequestParam(defaultValue = "") String inviteCode,
                              @RequestParam(defaultValue = "") String readerName,
                              @RequestParam(defaultValue = "") String readerGender,
                              @RequestParam(defaultValue = "") String readerPhone,
                              @RequestParam(defaultValue = "") String readerType) {
        String actualRole = role.isEmpty() ? "读者" : role;
        if (userMapper.selectByUsername(username) != null) return Result.error("用户名已存在");
        if (!"读者".equals(actualRole)) {
            if (inviteCode.isEmpty()) return Result.error("管理员注册需要邀请码");
            InviteCode ic = inviteCodeMapper.selectByCode(inviteCode);
            if (ic == null || Boolean.TRUE.equals(ic.getIsUsed())) return Result.error("邀请码无效或已使用");
            if (ic.getExpireTime() != null && ic.getExpireTime().isBefore(LocalDateTime.now())) return Result.error("邀请码已过期");
            if (!ic.getRole().equals(actualRole)) return Result.error("邀请码角色不匹配");
            ic.setIsUsed(true); inviteCodeMapper.updateById(ic);
        }

        // 读者角色：在reader表插入记录，自动生成reader_id
        Integer newReaderId = null;
        if ("读者".equals(actualRole)) {
            try (Connection c = dataSource.getConnection();
                 PreparedStatement ps = c.prepareStatement(
                     "INSERT INTO reader (reader_name, gender, phone, reader_type, register_date, status) VALUES (?,?,?,?,CURDATE(),'正常')",
                     PreparedStatement.RETURN_GENERATED_KEYS)) {
                ps.setString(1, readerName.isEmpty() ? username : readerName);
                ps.setString(2, readerGender.isEmpty() ? "男" : readerGender);
                ps.setString(3, readerPhone);
                ps.setString(4, readerType.isEmpty() ? "本科生" : readerType);
                ps.executeUpdate();
                try (ResultSet rs = ps.getGeneratedKeys()) {
                    if (rs.next()) newReaderId = rs.getInt(1);
                }
            } catch (SQLException e) {
                // 如果readerName已在reader表中有重名导致unique约束，则报错
                return Result.error("创建读者记录失败，姓名可能已存在: " + e.getMessage());
            }
            if (newReaderId == null) return Result.error("读者记录创建失败，请重试");
        }

        User u = new User();
        u.setUsername(username); u.setPassword(password);
        u.setRole(actualRole);
        u.setReaderId(newReaderId);
        u.setIsActive(true); u.setCreateTime(LocalDateTime.now());
        userMapper.insert(u);
        return Result.success("注册成功");
    }

    /** 用户注销（软删除：将is_active设为false） */
    @PostMapping("/deactivate/{userId}")
    public Result<?> deactivate(@PathVariable Integer userId) {
        User u = userMapper.selectById(userId);
        if (u == null) return Result.error("用户不存在");
        u.setIsActive(false);
        userMapper.updateById(u);
        // 同时将关联的reader状态改为注销
        if (u.getReaderId() != null) {
            try (Connection c = dataSource.getConnection();
                 PreparedStatement ps = c.prepareStatement("UPDATE reader SET status='注销' WHERE reader_id=?")) {
                ps.setInt(1, u.getReaderId());
                ps.executeUpdate();
            } catch (Exception ignored) {}
        }
        return Result.success("用户已注销");
    }

    /** 重新激活（解注销） */
    @PostMapping("/activate/{userId}")
    public Result<?> activate(@PathVariable Integer userId) {
        User u = userMapper.selectById(userId);
        if (u == null) return Result.error("用户不存在");
        u.setIsActive(true);
        userMapper.updateById(u);
        if (u.getReaderId() != null) {
            try (Connection c = dataSource.getConnection();
                 PreparedStatement ps = c.prepareStatement("UPDATE reader SET status='正常' WHERE reader_id=?")) {
                ps.setInt(1, u.getReaderId());
                ps.executeUpdate();
            } catch (Exception ignored) {}
        }
        return Result.success("用户已重新激活");
    }

    @GetMapping("/users")
    public Result<List<User>> users() { return Result.success(userMapper.selectList(null)); }

    @GetMapping("/audit-log")
    public Result<?> auditLog() {
        try (Connection c = dataSource.getConnection();
             Statement s = c.createStatement();
             ResultSet rs = s.executeQuery("SELECT * FROM AuditLog ORDER BY log_id DESC LIMIT 100")) {
            List<Map<String,Object>> list = new ArrayList<>();
            while (rs.next()) {
                Map<String,Object> m = new LinkedHashMap<>();
                m.put("logId", rs.getInt("log_id")); m.put("type", rs.getString("operation_type"));
                m.put("table", rs.getString("operator_table")); m.put("targetId", rs.getInt("target_id"));
                m.put("detail", rs.getString("detail")); m.put("time", rs.getString("operation_time"));
                list.add(m);
            }
            return Result.success(list);
        } catch (Exception e) { return Result.success(Collections.emptyList()); }
    }
}
