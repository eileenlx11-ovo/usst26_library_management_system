package com.lib.controller.bookadmin;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.lib.mapper.BorrowRecordMapper;
import com.lib.mapper.FineMapper;
import com.lib.pojo.BorrowRecord;
import com.lib.pojo.Fine;
import com.lib.pojo.Result;
import com.lib.service.BorrowService;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import javax.sql.DataSource;
import java.sql.*;

@RestController("bookadminBorrowController")
@RequestMapping("/bookadmin/borrow")
public class BorrowController {

    @Autowired private BorrowService borrowService;
    @Autowired private BorrowRecordMapper borrowRecordMapper;
    @Autowired private FineMapper fineMapper;
    @Autowired private DataSource dataSource;

    @PostMapping("/lend")
    public Result lendBook(@RequestParam(required = false) Integer readerId,
                           @RequestParam(required = false) Integer bookId) {
        if (readerId == null || bookId == null) return Result.error("读者ID和图书ID不能为空！");
        try { borrowService.lendBook(readerId, bookId); return Result.success("借阅登记成功！"); }
        catch (Exception e) { return Result.error(e.getMessage()); }
    }

    @PostMapping("/return")
    public Result returnBook(@RequestParam(required = false) Integer borrowId) {
        if (borrowId == null) return Result.error("借阅流水号不能为空！");
        try { borrowService.returnBook(borrowId); return Result.success("归还成功！"); }
        catch (Exception e) { return Result.error(e.getMessage()); }
    }

    @PostMapping("/renew")
    public Result renewBook(@RequestParam(required = false) Integer borrowId) {
        if (borrowId == null) return Result.error("借阅流水号不能为空！");
        try { borrowService.renewBook(borrowId); return Result.success("续借成功！"); }
        catch (Exception e) { return Result.error(e.getMessage()); }
    }

    @PostMapping("/notify")
    public Result notifyOverdue() {
        try { List<Integer> ids = borrowService.notifyOverdue();
            return ids.isEmpty() ? Result.success("当前系统内无逾期读者需催还。")
                : Result.success("已成功生成催还名单：" + ids);
        } catch (Exception e) { return Result.error(e.getMessage()); }
    }

    @GetMapping("/list")
    public Result<List<BorrowRecord>> listAll() {
        return Result.success(borrowRecordMapper.selectList(
            new QueryWrapper<BorrowRecord>().orderByDesc("borrow_id")));
    }

    @GetMapping("/list/{readerId}")
    public Result<List<BorrowRecord>> listByReader(@PathVariable Integer readerId) {
        return Result.success(borrowRecordMapper.selectList(
            new QueryWrapper<BorrowRecord>().eq("reader_id", readerId).orderByDesc("borrow_id")));
    }

    /** 罚款列表—带读者信息 */
    @GetMapping("/fines")
    public Result<?> listFines() {
        try (Connection c = dataSource.getConnection();
             Statement s = c.createStatement();
             ResultSet rs = s.executeQuery("SELECT f.*, br.reader_id AS readerId FROM fine f JOIN borrowrecord br ON f.borrow_id=br.borrow_id ORDER BY f.fine_id DESC")) {
            List<Map<String,Object>> list = new ArrayList<>();
            while (rs.next()) {
                Map<String,Object> m = new LinkedHashMap<>();
                m.put("fineId", rs.getObject("fine_id"));
                m.put("borrowId", rs.getObject("borrow_id"));
                m.put("fineAmount", rs.getObject("fine_amount"));
                m.put("isPaid", rs.getObject("is_paid"));
                m.put("createDate", rs.getString("create_date"));
                m.put("readerId", rs.getObject("readerId"));
                list.add(m);
            }
            return Result.success(list);
        } catch (Exception e) { return Result.error(e.getMessage()); }
    }
}
