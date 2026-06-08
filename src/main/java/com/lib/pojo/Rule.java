package com.lib.pojo;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;

@Data
@TableName("Rule")
public class Rule {

    @TableId(type = IdType.AUTO)
    private Integer ruleId;
    
    private String readerType;     // 读者类型 (比如：学生、教师)
    private Integer maxBorrowDays; // 最大借阅天数
    private Integer maxBorrowCount;// 最大借阅数量
    
    // 注意：凡是涉及钱（DECIMAL）的，在 Java 里必须用 BigDecimal，不能用 Double，否则算钱会丢失精度！
    private BigDecimal finePerDay; // 每日罚款金额
    
    private Integer maxRenewTimes; // 最大续借次数
    private Integer renewDays;     // 每次续借增加的天数
}