package com.lib.controller.bookadmin;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController("bookadminBorrowController")
@RequestMapping("/bookadmin/borrow")
@Slf4j
public class BorrowController {

    //借阅处理（录入借书证号、图书编号完成借阅）
    //归还处理（计算逾期费用并收取）
    //逾期催还通知
}
