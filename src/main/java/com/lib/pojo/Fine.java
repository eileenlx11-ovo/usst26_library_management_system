package com.lib.pojo;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@TableName("Fine")
public class Fine {

    @TableId(type = IdType.AUTO)
    private Integer fineId;
    
    private Integer borrowId;      // 对应哪一条借阅记录
    private BigDecimal fineAmount; // 罚款总金额
    private Boolean isPaid;        // 是否已支付
    private LocalDate createDate;  // 罚款产生日期
    private LocalDate payDate;     // 实际支付日期
}