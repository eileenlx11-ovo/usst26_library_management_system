package com.lib.service;

import com.lib.dto.BookAddDTO;
import com.lib.dto.BookPageQueryDTO;
import com.lib.dto.BookUpdateDTO;
import com.lib.pojo.PageResult;
import com.lib.vo.BookDetailVO;

public interface BookService {
    PageResult pageQuery(BookPageQueryDTO queryDTO);

    void addBook(BookAddDTO addDTO);

    BookDetailVO getBookDetailById(Integer bookId);

    void updateBook(BookUpdateDTO updateDTO);

    void deleteBook(Integer bookId);
}
