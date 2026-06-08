package com.lib.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.lib.mapper.BorrowRecordMapper;
import com.lib.mapper.FineMapper;
import com.lib.mapper.RuleMapper;
import com.lib.pojo.BorrowRecord;
import com.lib.pojo.Fine;
import com.lib.pojo.Rule;
import com.lib.service.BorrowService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class BorrowServiceImpl implements BorrowService {

    @Autowired
    private BorrowRecordMapper borrowRecordMapper;

    @Autowired
    private FineMapper fineMapper;

    @Autowired
    private RuleMapper ruleMapper;

    @Override
    public void lendBook(Integer readerId, Integer bookId) {
        Rule rule = ruleMapper.selectById(1);
        if (rule == null) {
            throw new RuntimeException("系统借阅规则未配置，借阅失败！");
        }

        LocalDate borrowDate = LocalDate.now();
        LocalDate dueDate = borrowDate.plusDays(rule.getMaxBorrowDays());

        BorrowRecord record = new BorrowRecord();
        record.setReaderId(readerId);
        record.setBookId(bookId);
        record.setRuleId(rule.getRuleId());
        record.setBorrowDate(borrowDate);
        record.setDueDate(dueDate);
        record.setIsRenewed(false);
        record.setOverdueDays(0);
        record.setBorrowStatus("借阅中");

        int result = borrowRecordMapper.insert(record);
        if (result <= 0) {
            throw new RuntimeException("数据库写入异常，借阅流水生成失败！");
        }
    }

    @Override
    public void returnBook(Integer borrowId) {
        BorrowRecord record = borrowRecordMapper.selectById(borrowId);
        if (record == null) {
            throw new RuntimeException("系统中找不到这条借阅记录，操作失败！");
        }
        if ("已归还".equals(record.getBorrowStatus())) {
            throw new RuntimeException("这本书已经归还过了，请勿重复操作！");
        }

        LocalDate today = LocalDate.now();
        LocalDate dueDate = record.getDueDate();
        long overdueDays = 0;

        if (today.isAfter(dueDate)) {
            overdueDays = ChronoUnit.DAYS.between(dueDate, today);
        }

        if (overdueDays > 0) {
            Rule rule = ruleMapper.selectById(record.getRuleId());
            if (rule != null) {
                BigDecimal totalFine = rule.getFinePerDay().multiply(new BigDecimal(overdueDays));

                Fine fine = new Fine();
                fine.setBorrowId(borrowId);
                fine.setFineAmount(totalFine);
                fine.setIsPaid(false);
                fine.setCreateDate(today);

                fineMapper.insert(fine);
            }
        }

        record.setReturnDate(today);
        record.setOverdueDays((int) overdueDays);
        record.setBorrowStatus("已归还");
        borrowRecordMapper.updateById(record);
    }

    @Override
    public List<Integer> notifyOverdue() {
        LocalDate today = LocalDate.now();

        LambdaQueryWrapper<BorrowRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.lt(BorrowRecord::getDueDate, today)
               .eq(BorrowRecord::getBorrowStatus, "借阅中");

        List<BorrowRecord> overdueRecords = borrowRecordMapper.selectList(wrapper);

        List<Integer> readerIds = new ArrayList<>();
        for (BorrowRecord record : overdueRecords) {
            if (!readerIds.contains(record.getReaderId())) {
                readerIds.add(record.getReaderId());
            }
        }

        return readerIds;
    }
}
