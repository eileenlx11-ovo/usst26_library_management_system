package com.lib.controller.reader;


import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/reader/borrow")
@Slf4j
public class BorrowController {

    //借阅图书（选择图书后借出）
    //归还图书
    //查看个人借阅记录及应还日期
    //续借图书（可续借一次）
}
