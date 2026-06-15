package com.lib.service.impl;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.lib.dto.BookAddDTO;
import com.lib.dto.BookPageQueryDTO;
import com.lib.dto.BookUpdateDTO;
import com.lib.entity.Author;
import com.lib.entity.Book;
import com.lib.entity.Category;
import com.lib.entity.Publisher;
import com.lib.mapper.AuthorMapper;
import com.lib.mapper.BookMapper;
import com.lib.mapper.CategoryMapper;
import com.lib.mapper.PublisherMapper;
import com.lib.pojo.PageResult;
import com.lib.service.BookService;
import com.lib.vo.BookDetailVO;
import com.lib.vo.BookVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
public class BookServiceimpl implements BookService {
    @Autowired private BookMapper bookMapper;
    @Autowired private AuthorMapper authorMapper;
    @Autowired private CategoryMapper categoryMapper;
    @Autowired private PublisherMapper publisherMapper;

    @Override
    public PageResult pageQuery(BookPageQueryDTO queryDTO) {
        Page<BookVO> page = new Page<>(queryDTO.getPageNum(), queryDTO.getPageSize());
        page = bookMapper.selectByCondition(page, queryDTO);
        return new PageResult(page.getTotal(), page.getRecords());
    }

    @Override
    @Transactional
    public void addBook(BookAddDTO addDTO) {
        Author author = authorMapper.selectByName(addDTO.getAuthorName());
        if (author == null) { author = new Author(); author.setAuthorName(addDTO.getAuthorName()); authorMapper.insert(author); }
        Category category = categoryMapper.selectByName(addDTO.getCategoryName());
        if (category == null) { category = new Category(); category.setCategoryName(addDTO.getCategoryName()); categoryMapper.insert(category); }
        Publisher publisher = publisherMapper.selectByName(addDTO.getPublisherName());
        if (publisher == null) { publisher = new Publisher(); publisher.setPublisherName(addDTO.getPublisherName()); publisherMapper.insert(publisher); }
        if (bookMapper.selectByIsbn(addDTO.getIsbn()) != null) { throw new RuntimeException("ISBN已存在"); }
        Book book = new Book();
        BeanUtils.copyProperties(addDTO, book);
        book.setAuthorId(author.getAuthorId()); book.setCategoryId(category.getCategoryId()); book.setPublisherId(publisher.getPublisherId());
        if (book.getAvailableCount() == null) book.setAvailableCount(book.getTotalCount());
        if (book.getStatus() == null || book.getStatus().isEmpty()) book.setStatus("在馆");
        bookMapper.insert(book);
    }

    @Override
    public BookDetailVO getBookDetailById(Integer bookId) { return bookMapper.selectBookDetailById(bookId); }

    @Override
    @Transactional
    public void updateBook(BookUpdateDTO updateDTO) {
        Book existing = bookMapper.selectById(updateDTO.getBookId());
        if (existing == null) throw new RuntimeException("图书不存在");
        if (!existing.getIsbn().equals(updateDTO.getIsbn()) && bookMapper.selectByIsbn(updateDTO.getIsbn()) != null)
            throw new RuntimeException("ISBN已存在");
        Author author = authorMapper.selectByName(updateDTO.getAuthorName());
        if (author == null) { author = new Author(); author.setAuthorName(updateDTO.getAuthorName()); authorMapper.insert(author); }
        Category cat = categoryMapper.selectByName(updateDTO.getCategoryName());
        if (cat == null) { cat = new Category(); cat.setCategoryName(updateDTO.getCategoryName()); categoryMapper.insert(cat); }
        Publisher pub = publisherMapper.selectByName(updateDTO.getPublisherName());
        if (pub == null) { pub = new Publisher(); pub.setPublisherName(updateDTO.getPublisherName()); publisherMapper.insert(pub); }
        Book book = new Book();
        BeanUtils.copyProperties(updateDTO, book);
        book.setAuthorId(author.getAuthorId()); book.setCategoryId(cat.getCategoryId()); book.setPublisherId(pub.getPublisherId());
        bookMapper.update(book);
    }

    @Override
    public void deleteBook(Integer bookId) {
        if (bookMapper.selectById(bookId) == null) throw new RuntimeException("图书不存在");
        int cnt = bookMapper.countBorrowRecords(bookId);
        if (cnt > 0) throw new RuntimeException("该书有 " + cnt + " 条借阅记录，无法删除");
        bookMapper.deleteById(bookId);
    }
}
