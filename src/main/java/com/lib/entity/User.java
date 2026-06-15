package com.lib.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class User {
    private Integer userId;
    private String username;
    private String password;
    private String role;
    private Integer readerId;
    private LocalDateTime createTime;
    private LocalDateTime lastLogin;
    private Boolean isActive;
}
