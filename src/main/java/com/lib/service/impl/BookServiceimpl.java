package com.lib.service.impl;

import com.github.pagehelper.Page;
import com.github.pagehelper.PageHelper;
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

import java.util.List;


@Service
@Slf4j
public class BookServiceimpl implements BookService {
    @Autowired
    private BookMapper bookMapper;

    @Autowired
    private AuthorMapper authorMapper;

    @Autowired
    private CategoryMapper categoryMapper;

    @Autowired
    private PublisherMapper publisherMapper;

    @Override
    public PageResult pageQuery(BookPageQueryDTO queryDTO) {
        // 1. 开启分页
        PageHelper.startPage(queryDTO.getPageNum(), queryDTO.getPageSize());
        // 2. 执行查询（自动拦截并添加 limit）
        List<BookVO> list = bookMapper.selectByCondition(queryDTO);
        // 3. 获取分页信息
        Page<BookVO> page = (Page<BookVO>) list;
        // 4. 封装为 PageResult
        return new PageResult(page.getTotal(), page.getResult());
    }

    @Override
    @Transactional
    public void addBook(BookAddDTO addDTO) {

        // 1. 处理作者：根据名称查询，不存在则创建
        Author author = authorMapper.selectByName(addDTO.getAuthorName());
        if (author == null) {
            author = new Author();
            author.setAuthorName(addDTO.getAuthorName());
            authorMapper.insert(author);
        }

        // 2. 处理分类：根据名称查询，不存在则创建
        Category category = categoryMapper.selectByName(addDTO.getCategoryName());
        if (category == null) {
            category = new Category();
            category.setCategoryName(addDTO.getCategoryName());
            categoryMapper.insert(category);
        }

        // 3. 处理出版社：根据名称查询，不存在则创建
        Publisher publisher = publisherMapper.selectByName(addDTO.getPublisherName());
        if (publisher == null) {
            publisher = new Publisher();
            publisher.setPublisherName(addDTO.getPublisherName());
            publisherMapper.insert(publisher);
        }

        // 4. 检查 ISBN 是否重复
        Book existingBook = bookMapper.selectByIsbn(addDTO.getIsbn());
        if (existingBook != null) {
            throw new RuntimeException("ISBN已存在，请勿重复添加");
        }

        // 5. DTO 转 Entity，设置外键 ID
        Book book = new Book();
        BeanUtils.copyProperties(addDTO, book);
        book.setAuthorId(author.getAuthorId());
        book.setCategoryId(category.getCategoryId());
        book.setPublisherId(publisher.getPublisherId());

        // 6. 设置默认值
        if (book.getAvailableCount() == null) {
            book.setAvailableCount(book.getTotalCount());
        }
        // 状态默认为"在馆"
        if (book.getStatus() == null || book.getStatus().isEmpty()) {
            book.setStatus("在馆");
        }

        // 7. 插入数据库
        bookMapper.insert(book);
    }

    @Override
    public BookDetailVO getBookDetailById(Integer bookId) {
        return bookMapper.selectBookDetailById(bookId);
    }

    @Override
    public void updateBook(BookUpdateDTO updateDTO) {
        Book existingBook = bookMapper.selectById(updateDTO.getBookId());
        if (existingBook == null) {
            throw new RuntimeException("图书不存在");
        }

        // 2. 如果修改了ISBN，检查是否与其他图书重复
        if (!existingBook.getIsbn().equals(updateDTO.getIsbn())) {
            Book bookByIsbn = bookMapper.selectByIsbn(updateDTO.getIsbn());
            if (bookByIsbn != null) {
                throw new RuntimeException("ISBN已存在，请勿重复");
            }
        }

        // 3. 处理作者
        Author author = authorMapper.selectByName(updateDTO.getAuthorName());
        if (author == null) {
            author = new Author();
            author.setAuthorName(updateDTO.getAuthorName());
            authorMapper.insert(author);
        }

        // 4. 处理分类
        Category category = categoryMapper.selectByName(updateDTO.getCategoryName());
        if (category == null) {
            category = new Category();
            category.setCategoryName(updateDTO.getCategoryName());
            categoryMapper.insert(category);
        }

        // 5. 处理出版社
        Publisher publisher = publisherMapper.selectByName(updateDTO.getPublisherName());
        if (publisher == null) {
            publisher = new Publisher();
            publisher.setPublisherName(updateDTO.getPublisherName());
            publisherMapper.insert(publisher);
        }

        // 6. 更新图书
        Book book = new Book();
        BeanUtils.copyProperties(updateDTO, book);
        book.setAuthorId(author.getAuthorId());
        book.setCategoryId(category.getCategoryId());
        book.setPublisherId(publisher.getPublisherId());

        bookMapper.update(book);
    }

    @Override
    public void deleteBook(Integer bookId) {
        // 1. 检查图书是否存在
        Book book = bookMapper.selectById(bookId);
        if (book == null) {
            throw new RuntimeException("图书不存在");
        }

        // 2. 检查是否有任何借阅记录（不管是否归还）
        int borrowCount = bookMapper.countBorrowRecords(bookId);
        if (borrowCount > 0) {
            throw new RuntimeException("该书有 " + borrowCount + " 条借阅记录，无法删除");
        }

        // 3. 物理删除图书
        bookMapper.deleteById(bookId);
    }
}

