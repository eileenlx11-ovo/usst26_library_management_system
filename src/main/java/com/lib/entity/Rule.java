package com.lib.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Rule {
    private Integer ruleId;
    private String readerType;
    private Integer maxBorrowDays;
    private Integer maxBorrowCount;
    private BigDecimal finePerDay;
    private Integer maxRenewTimes;
    private Integer renewDays;
}