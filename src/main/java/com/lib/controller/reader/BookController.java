package com.lib.controller.reader;

import com.lib.dto.BookPageQueryDTO;
import com.lib.pojo.PageResult;
import com.lib.pojo.Result;
import com.lib.service.BookService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/reader/book")
@Slf4j
public class BookController {

    @Autowired
    private BookService bookService;

    /**
     * 图书分页查询（支持书名、作者、ISBN、分类、状态）
     */
    @GetMapping("/page")
    public Result<PageResult> pageQuery(BookPageQueryDTO queryDTO) {
        log.info("图书分页查询参数：{}", queryDTO);
        PageResult pageResult = bookService.pageQuery(queryDTO);
        return Result.success(pageResult);
    }

}
