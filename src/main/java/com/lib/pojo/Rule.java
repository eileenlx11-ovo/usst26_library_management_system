package com.lib.pojo;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.math.BigDecimal;

@TableName("Rule")
public class Rule {

    @TableId(type = IdType.AUTO)
    private Integer ruleId;
    private String readerType;
    private Integer maxBorrowDays;
    private Integer maxBorrowCount;
    private BigDecimal finePerDay;
    private Integer maxRenewTimes;
    private Integer renewDays;

    public Integer getRuleId() { return ruleId; }
    public void setRuleId(Integer ruleId) { this.ruleId = ruleId; }
    public String getReaderType() { return readerType; }
    public void setReaderType(String readerType) { this.readerType = readerType; }
    public Integer getMaxBorrowDays() { return maxBorrowDays; }
    public void setMaxBorrowDays(Integer maxBorrowDays) { this.maxBorrowDays = maxBorrowDays; }
    public Integer getMaxBorrowCount() { return maxBorrowCount; }
    public void setMaxBorrowCount(Integer maxBorrowCount) { this.maxBorrowCount = maxBorrowCount; }
    public BigDecimal getFinePerDay() { return finePerDay; }
    public void setFinePerDay(BigDecimal finePerDay) { this.finePerDay = finePerDay; }
    public Integer getMaxRenewTimes() { return maxRenewTimes; }
    public void setMaxRenewTimes(Integer maxRenewTimes) { this.maxRenewTimes = maxRenewTimes; }
    public Integer getRenewDays() { return renewDays; }
    public void setRenewDays(Integer renewDays) { this.renewDays = renewDays; }
}
