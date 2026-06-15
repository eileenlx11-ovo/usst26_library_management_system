package com.lib.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class InviteCode {
    private Integer codeId;
    private String code;
    private String role;
    private Integer createdBy;
    private Integer usedBy;
    private Boolean isUsed;
    private LocalDateTime createTime;
    private LocalDateTime expireTime;
}
