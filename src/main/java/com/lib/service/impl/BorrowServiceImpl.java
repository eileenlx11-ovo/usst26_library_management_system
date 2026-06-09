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
import org.springframework.transaction.annotation.Transactional;

@Service
public class BorrowServiceImpl implements BorrowService {

    private static final String STATUS_BORROWING = "借阅中";
    private static final String STATUS_RETURNED = "已归还";
    private static final String READER_STATUS_NORMAL = "正常";

    @Autowired
    private BorrowRecordMapper borrowRecordMapper;

    @Autowired
    private FineMapper fineMapper;

    @Autowired
    private RuleMapper ruleMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void lendBook(Integer readerId, Integer bookId) {
        if (borrowRecordMapper.countReaderById(readerId) == 0) {
            throw new RuntimeException("读者不存在，借阅失败！");
        }

        String readerStatus = borrowRecordMapper.selectReaderStatusById(readerId);
        if (!READER_STATUS_NORMAL.equals(readerStatus)) {
            throw new RuntimeException("读者状态异常，无法借阅！");
        }

        LambdaQueryWrapper<BorrowRecord> bookBorrowWrapper = new LambdaQueryWrapper<>();
        bookBorrowWrapper.eq(BorrowRecord::getBookId, bookId)
                .eq(BorrowRecord::getBorrowStatus, STATUS_BORROWING);
        if (borrowRecordMapper.selectCount(bookBorrowWrapper) > 0) {
            throw new RuntimeException("该书已被借出，无法重复借阅！");
        }

        String readerType = borrowRecordMapper.selectReaderTypeById(readerId);
        LambdaQueryWrapper<Rule> ruleWrapper = new LambdaQueryWrapper<>();
        ruleWrapper.eq(Rule::getReaderType, readerType);
        Rule rule = ruleMapper.selectOne(ruleWrapper);
        if (rule == null) {
            throw new RuntimeException("该读者类型未配置借阅规则，借阅失败！");
        }

        LambdaQueryWrapper<BorrowRecord> readerBorrowWrapper = new LambdaQueryWrapper<>();
        readerBorrowWrapper.eq(BorrowRecord::getReaderId, readerId)
                .eq(BorrowRecord::getBorrowStatus, STATUS_BORROWING);
        long activeBorrowCount = borrowRecordMapper.selectCount(readerBorrowWrapper);
        if (activeBorrowCount >= rule.getMaxBorrowCount()) {
            throw new RuntimeException("已达最大借阅数量，无法继续借阅！");
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
        record.setBorrowStatus(STATUS_BORROWING);

        int result = borrowRecordMapper.insert(record);
        if (result <= 0) {
            throw new RuntimeException("数据库写入异常，借阅流水生成失败！");
        }

        // TODO: 队友完成 Book 模块后，在此校验图书是否存在并扣减库存
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void returnBook(Integer borrowId) {
        if (borrowId == null) {
            throw new RuntimeException("借阅流水号不能为空！");
        }

        BorrowRecord record = borrowRecordMapper.selectById(borrowId);
        if (record == null) {
            throw new RuntimeException("系统中找不到这条借阅记录，操作失败！");
        }
        if (STATUS_RETURNED.equals(record.getBorrowStatus())) {
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
        record.setBorrowStatus(STATUS_RETURNED);
        borrowRecordMapper.updateById(record);

        // TODO: 队友完成 Book 模块后，在此恢复图书库存
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void renewBook(Integer borrowId) {
        if (borrowId == null) {
            throw new RuntimeException("借阅流水号不能为空！");
        }

        BorrowRecord record = borrowRecordMapper.selectById(borrowId);
        if (record == null) {
            throw new RuntimeException("系统中找不到这条借阅记录，续借失败！");
        }
        if (STATUS_RETURNED.equals(record.getBorrowStatus())) {
            throw new RuntimeException("该书已归还，无法续借！");
        }
        if (Boolean.TRUE.equals(record.getIsRenewed())) {
            throw new RuntimeException("该借阅记录已续借过，无法再次续借！");
        }

        LocalDate today = LocalDate.now();
        if (today.isAfter(record.getDueDate())) {
            throw new RuntimeException("图书已逾期，无法续借！");
        }

        Rule rule = ruleMapper.selectById(record.getRuleId());
        if (rule == null) {
            throw new RuntimeException("借阅规则不存在，续借失败！");
        }
        if (rule.getMaxRenewTimes() == null || rule.getMaxRenewTimes() <= 0) {
            throw new RuntimeException("当前规则不允许续借！");
        }

        record.setDueDate(record.getDueDate().plusDays(rule.getRenewDays()));
        record.setIsRenewed(true);
        borrowRecordMapper.updateById(record);
    }

    @Override
    public List<Integer> notifyOverdue() {
        LocalDate today = LocalDate.now();

        LambdaQueryWrapper<BorrowRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.lt(BorrowRecord::getDueDate, today)
               .eq(BorrowRecord::getBorrowStatus, STATUS_BORROWING);

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
