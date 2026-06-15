package com.lib.controller.reader;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.lib.mapper.BorrowRecordMapper;
import com.lib.pojo.BorrowRecord;
import com.lib.pojo.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/reader/borrow")
public class BorrowController {
    @Autowired private BorrowRecordMapper borrowRecordMapper;

    @GetMapping("/list/{readerId}")
    public Result<List<BorrowRecord>> list(@PathVariable Integer readerId) {
        QueryWrapper<BorrowRecord> w = new QueryWrapper<>();
        w.eq("reader_id", readerId).orderByDesc("borrow_id");
        return Result.success(borrowRecordMapper.selectList(w));
    }
}
