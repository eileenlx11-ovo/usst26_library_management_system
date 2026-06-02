package com.lib.controller.systemadmin;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController("systemadminBorrowController")
@RequestMapping("/systemadmin/borrow")
@Slf4j
public class BorrowController {

    //借阅规则设置（最大借阅数量、借阅天数、逾期费标准）
}
