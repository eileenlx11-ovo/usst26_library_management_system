package com.lib.controller.systemadmin;

import com.lib.pojo.Result;
import com.lib.service.ToolService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import javax.sql.DataSource;
import java.sql.*;
import java.util.*;

@RestController("systemadminToolController")
@RequestMapping("/systemadmin/tool")
public class ToolController {
    @Autowired private ToolService toolService;
    @Autowired private DataSource dataSource;

    @GetMapping("/hot-books") public Result hotBooks() { return Result.success(toolService.hotBooks()); }
    @GetMapping("/active-readers") public Result activeReaders() { return Result.success(toolService.activeReaders()); }
    @GetMapping("/overdue-list") public Result overdueList() { return Result.success(toolService.overdueList()); }

    @GetMapping("/fine-list")
    public Result fineList() {
        try (Connection c = dataSource.getConnection();
             Statement s = c.createStatement();
             ResultSet rs = s.executeQuery("SELECT f.fine_id AS id,f.borrow_id AS bid,f.fine_amount AS amt,f.is_paid AS paid,f.create_date AS dt,r.reader_name AS rn,b.book_name AS bn FROM fine f JOIN borrowrecord br ON f.borrow_id=br.borrow_id JOIN reader r ON br.reader_id=r.reader_id JOIN book b ON br.book_id=b.book_id ORDER BY f.fine_id DESC")) {
            List<Map<String,Object>> list = new ArrayList<>();
            while (rs.next()) { Map<String,Object> m = new LinkedHashMap<>(); for (int i=1;i<=rs.getMetaData().getColumnCount();i++) m.put(rs.getMetaData().getColumnLabel(i),rs.getObject(i)); list.add(m); }
            return Result.success(list);
        } catch (Exception e) { return Result.error(e.getMessage()); }
    }
}
