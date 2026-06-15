package com.lib.service.impl;

import com.lib.service.ToolService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.*;

@Service
public class ToolServiceimpl implements ToolService {
    @Autowired private DataSource dataSource;

    private List<Map<String,Object>> query(String sql) {
        List<Map<String,Object>> list = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            int cols = rs.getMetaData().getColumnCount();
            while (rs.next()) {
                Map<String,Object> row = new LinkedHashMap<>();
                for (int i = 1; i <= cols; i++) row.put(rs.getMetaData().getColumnLabel(i), rs.getObject(i));
                list.add(row);
            }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }

    @Override
    public List<Map<String,Object>> hotBooks() {
        return query("SELECT b.book_name AS name,COUNT(*) AS cnt FROM borrowrecord br JOIN book b ON br.book_id=b.book_id GROUP BY b.book_id,b.book_name ORDER BY cnt DESC LIMIT 10");
    }

    @Override
    public List<Map<String,Object>> activeReaders() {
        return query("SELECT r.reader_name AS name,COUNT(*) AS cnt FROM borrowrecord br JOIN reader r ON br.reader_id=r.reader_id GROUP BY r.reader_id,r.reader_name ORDER BY cnt DESC LIMIT 10");
    }

    @Override
    public List<Map<String,Object>> overdueList() {
        return query("SELECT r.reader_name AS readerName,r.phone,b.book_name AS bookName,br.due_date AS dueDate,DATEDIFF(CURDATE(),br.due_date) AS overdueDays,ru.fine_per_day*DATEDIFF(CURDATE(),br.due_date) AS fine FROM borrowrecord br JOIN reader r ON br.reader_id=r.reader_id JOIN book b ON br.book_id=b.book_id JOIN rule ru ON br.rule_id=ru.rule_id WHERE br.due_date<CURDATE() AND br.borrow_status!='已归还'");
    }
}
