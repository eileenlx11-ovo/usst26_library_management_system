package com.lib.pojo;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDate;

@Data // 自动帮你生成所有的 get/set 方法
@TableName("BorrowRecord") // 告诉 MyBatis-Plus 这个类对应数据库里的哪张表
public class BorrowRecord {

    @TableId(type = IdType.AUTO) // 告诉框架这是主键，并且是自增的
    private Integer borrowId;

    private Integer readerId;
    
    private Integer bookId;
    
    private Integer ruleId;
    
    private LocalDate borrowDate; // Java里的日期类型完美对应SQL的 date
    
    private LocalDate dueDate;    // 应还日期
    
    private LocalDate returnDate; // 实际归还日期
    
    private Boolean isRenewed;    // 是否续借过 (对应SQL的 boolean default false)
    
    private Integer overdueDays;  // 逾期天数
    
    private String borrowStatus;  // 借阅状态 ('借阅中', '已归还', '已逾期')
}