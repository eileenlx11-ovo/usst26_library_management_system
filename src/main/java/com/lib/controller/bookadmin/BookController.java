package com.lib.controller.bookadmin;


import com.lib.dto.BookAddDTO;
import com.lib.dto.BookPageQueryDTO;
import com.lib.dto.BookUpdateDTO;
import com.lib.pojo.PageResult;
import com.lib.pojo.Result;
import com.lib.service.BookService;
import com.lib.vo.BookDetailVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController("bookadminBookController")
@RequestMapping("/bookadmin/book")
@Slf4j
public class BookController {

    //图书信息管理（添加、修改、删除图书，包括书名、作者、ISBN、出版社、分类）
    @Autowired
    private BookService bookService;

    /**
     * 图书分页查询（支持书名、作者、ISBN、分类、状态）
     */
    @GetMapping("/page")
    public Result<PageResult> pageQuery(BookPageQueryDTO queryDTO) {
        log.info("图书管理员-图书分页查询参数：{}", queryDTO);
        PageResult pageResult = bookService.pageQuery(queryDTO);
        return Result.success(pageResult);
    }

    @PostMapping("/add")
    public Result addBook(@RequestBody BookAddDTO addDTO) {
        log.info("添加图书参数：{}", addDTO);
        bookService.addBook(addDTO);
        return Result.success();
    }

    @GetMapping("/{bookId}")
    public Result<BookDetailVO> getBookById(@PathVariable Integer bookId) {
        log.info("查询图书详情，bookId：{}", bookId);
        BookDetailVO bookDetail = bookService.getBookDetailById(bookId);
        return Result.success(bookDetail);
    }

    /**
     * 修改图书
     */
    @PutMapping
    public Result<Void> updateBook(@RequestBody BookUpdateDTO updateDTO) {
        log.info("修改图书参数：{}", updateDTO);
        bookService.updateBook(updateDTO);
        return Result.success();
    }

    @DeleteMapping("/{bookId}")
    public Result<Void> deleteBook(@PathVariable Integer bookId) {
        log.info("删除图书，bookId：{}", bookId);
        bookService.deleteBook(bookId);
        return Result.success();
    }
}
