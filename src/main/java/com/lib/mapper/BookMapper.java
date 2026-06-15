package com.lib.mapper;

import com.lib.dto.BookPageQueryDTO;
import com.lib.entity.Book;
import com.lib.vo.BookDetailVO;
import com.lib.vo.BookVO;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface BookMapper {
    List<BookVO> selectByCondition(BookPageQueryDTO queryDTO);

    @Select("SELECT * FROM book WHERE isbn = #{isbn}")
    Book selectByIsbn(@Param("isbn") String isbn);

    /**
     * 新增图书
     */
    @Insert("INSERT INTO book (" +
            "book_name, isbn, author_id, category_id, publisher_id, " +
            "publish_date, price, total_count, available_count, status" +
            ") VALUES (" +
            "#{bookName}, #{isbn}, #{authorId}, #{categoryId}, #{publisherId}, " +
            "#{publishDate}, #{price}, #{totalCount}, #{availableCount}, #{status}" +
            ")")
    @Options(useGeneratedKeys = true, keyProperty = "bookId")
    void insert(Book book);

    @Select("SELECT * FROM book WHERE book_id = #{bookId}")
    Book selectById(Integer bookId);

    @Update("UPDATE book SET " +
            "book_name = #{bookName}, " +
            "isbn = #{isbn}, " +
            "author_id = #{authorId}, " +
            "category_id = #{categoryId}, " +
            "publisher_id = #{publisherId}, " +
            "publish_date = #{publishDate}, " +
            "price = #{price}, " +
            "total_count = #{totalCount}, " +
            "available_count = #{availableCount}, " +
            "status = #{status} " +
            "WHERE book_id = #{bookId}")
    void update(Book book);

    BookDetailVO selectBookDetailById(Integer bookId);

    @Delete("DELETE FROM book WHERE book_id = #{bookId}")
    void deleteById(Integer bookId);


    @Select("SELECT COUNT(*) FROM borrowrecord WHERE book_id = #{bookId}")
    int countBorrowRecords(Integer bookId);
}
