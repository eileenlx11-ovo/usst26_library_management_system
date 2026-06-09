package com.lib.controller.bookadmin;

import com.lib.pojo.Result;
import com.lib.service.BorrowService;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController("bookadminBorrowController")
@RequestMapping("/bookadmin/borrow")
@Slf4j
public class BorrowController {

    @Autowired
    private BorrowService borrowService;

    @PostMapping("/lend")
    public Result lendBook(
            @RequestParam(required = false) Integer readerId,
            @RequestParam(required = false) Integer bookId) {
        if (readerId == null || bookId == null) {
            return Result.error("读者ID和图书ID不能为空！");
        }
        log.info("收到借书请求：读者ID: {}, 图书ID: {}", readerId, bookId);
        try {
            borrowService.lendBook(readerId, bookId);
            return Result.success("借阅登记成功！");
        } catch (Exception e) {
            log.error("借阅处理失败：{}", e.getMessage());
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/return")
    public Result returnBook(@RequestParam(required = false) Integer borrowId) {
        if (borrowId == null) {
            return Result.error("借阅流水号不能为空！");
        }
        log.info("收到还书请求：准备处理流水号为 {} 的借阅记录", borrowId);
        try {
            borrowService.returnBook(borrowId);
            return Result.success("归还成功！");
        } catch (Exception e) {
            log.error("还书处理失败：{}", e.getMessage());
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/renew")
    public Result renewBook(@RequestParam(required = false) Integer borrowId) {
        if (borrowId == null) {
            return Result.error("借阅流水号不能为空！");
        }
        log.info("收到续借请求：准备处理流水号为 {} 的借阅记录", borrowId);
        try {
            borrowService.renewBook(borrowId);
            return Result.success("续借成功！");
        } catch (Exception e) {
            log.error("续借处理失败：{}", e.getMessage());
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/notify")
    public Result notifyOverdue() {
        log.info("业务触发：开始执行逾期催还检查流程...");
        try {
            List<Integer> readerIds = borrowService.notifyOverdue();
            if (readerIds.isEmpty()) {
                return Result.success("当前系统内无逾期读者需催还。");
            }
            return Result.success("已成功生成催还名单，需催还读者ID集合：" + readerIds);
        } catch (Exception e) {
            log.error("逾期催还检查执行异常：{}", e.getMessage(), e);
            return Result.error("系统异常，逾期催还检查执行失败！");
        }
    }
}
