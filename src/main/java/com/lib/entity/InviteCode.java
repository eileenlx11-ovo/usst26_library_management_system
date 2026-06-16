package com.lib.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("invitecode")
public class InviteCode {
    @TableId(type = IdType.AUTO)
    private Integer codeId;
    private String code;
    private String role;
    private Integer createdBy;
    private Integer usedBy;
    private Boolean isUsed;
    private LocalDateTime createTime;
    private LocalDateTime expireTime;
}
