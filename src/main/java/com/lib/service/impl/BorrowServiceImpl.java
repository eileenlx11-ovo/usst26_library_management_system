package com.lib.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
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

    @Autowired private BorrowRecordMapper borrowRecordMapper;
    @Autowired private FineMapper fineMapper;
    @Autowired private RuleMapper ruleMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void lendBook(Integer readerId, Integer bookId) {
        if (borrowRecordMapper.countReaderById(readerId) == 0)
            throw new RuntimeException("读者不存在，借阅失败！");
        if (!READER_STATUS_NORMAL.equals(borrowRecordMapper.selectReaderStatusById(readerId)))
            throw new RuntimeException("读者状态异常，无法借阅！");

        // 检查该书是否在借
        QueryWrapper<BorrowRecord> w1 = new QueryWrapper<>();
        w1.eq("book_id", bookId).eq("borrow_status", STATUS_BORROWING);
        if (borrowRecordMapper.selectCount(w1) > 0)
            throw new RuntimeException("该书已被借出，无法重复借阅！");

        // 查规则（取第一条，兼容重复数据）
        String readerType = borrowRecordMapper.selectReaderTypeById(readerId);
        QueryWrapper<Rule> rw = new QueryWrapper<>();
        rw.eq("reader_type", readerType).last("limit 1");
        Rule rule = ruleMapper.selectOne(rw);
        if (rule == null) throw new RuntimeException("该读者类型未配置借阅规则！");

        // 检查借阅上限
        QueryWrapper<BorrowRecord> w2 = new QueryWrapper<>();
        w2.eq("reader_id", readerId).eq("borrow_status", STATUS_BORROWING);
        if (borrowRecordMapper.selectCount(w2) >= rule.getMaxBorrowCount())
            throw new RuntimeException("已达最大借阅数量！");

        BorrowRecord r = new BorrowRecord();
        r.setReaderId(readerId); r.setBookId(bookId); r.setRuleId(rule.getRuleId());
        r.setBorrowDate(LocalDate.now()); r.setDueDate(LocalDate.now().plusDays(rule.getMaxBorrowDays()));
        r.setIsRenewed(false); r.setOverdueDays(0); r.setBorrowStatus(STATUS_BORROWING);
        if (borrowRecordMapper.insert(r) <= 0)
            throw new RuntimeException("借阅流水生成失败！");
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void returnBook(Integer borrowId) {
        if (borrowId == null) throw new RuntimeException("借阅流水号不能为空！");
        BorrowRecord rec = borrowRecordMapper.selectById(borrowId);
        if (rec == null) throw new RuntimeException("借阅记录不存在！");
        if (STATUS_RETURNED.equals(rec.getBorrowStatus())) throw new RuntimeException("已归还过！");

        LocalDate today = LocalDate.now();
        long overdueDays = today.isAfter(rec.getDueDate()) ? ChronoUnit.DAYS.between(rec.getDueDate(), today) : 0;

        // 逾期自动生成罚款（检查是否已存在，避免触发器重复）
        if (overdueDays > 0) {
            Rule rule = ruleMapper.selectById(rec.getRuleId());
            if (rule != null) {
                Long existing = fineMapper.selectCount(new QueryWrapper<Fine>().eq("borrow_id", borrowId));
                if (existing == 0) {
                    Fine fine = new Fine();
                    fine.setBorrowId(borrowId);
                    fine.setFineAmount(rule.getFinePerDay().multiply(new BigDecimal(overdueDays)));
                    fine.setIsPaid(false); fine.setCreateDate(today);
                    fineMapper.insert(fine);
                }
            }
        }

        rec.setReturnDate(today); rec.setOverdueDays((int) overdueDays); rec.setBorrowStatus(STATUS_RETURNED);
        borrowRecordMapper.updateById(rec);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void renewBook(Integer borrowId) {
        if (borrowId == null) throw new RuntimeException("借阅流水号不能为空！");
        BorrowRecord rec = borrowRecordMapper.selectById(borrowId);
        if (rec == null) throw new RuntimeException("借阅记录不存在！");
        if (STATUS_RETURNED.equals(rec.getBorrowStatus())) throw new RuntimeException("已归还，无法续借！");
        if (Boolean.TRUE.equals(rec.getIsRenewed())) throw new RuntimeException("已续借过！");
        if (LocalDate.now().isAfter(rec.getDueDate())) throw new RuntimeException("已逾期，无法续借！");

        Rule rule = ruleMapper.selectById(rec.getRuleId());
        if (rule == null || rule.getMaxRenewTimes() <= 0) throw new RuntimeException("规则不允许续借！");
        rec.setDueDate(rec.getDueDate().plusDays(rule.getRenewDays()));
        rec.setIsRenewed(true);
        borrowRecordMapper.updateById(rec);
    }

    @Override
    public List<Integer> notifyOverdue() {
        QueryWrapper<BorrowRecord> w = new QueryWrapper<>();
        w.lt("due_date", LocalDate.now()).eq("borrow_status", STATUS_BORROWING);
        List<BorrowRecord> overdue = borrowRecordMapper.selectList(w);
        List<Integer> ids = new ArrayList<>();
        for (BorrowRecord r : overdue) { if (!ids.contains(r.getReaderId())) ids.add(r.getReaderId()); }
        return ids;
    }
}
