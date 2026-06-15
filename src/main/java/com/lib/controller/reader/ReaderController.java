package com.lib.controller.reader;

import com.lib.entity.Reader;
import com.lib.mapper.ReaderMapper;
import com.lib.pojo.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/reader")
public class ReaderController {
    @Autowired private ReaderMapper readerMapper;

    @PutMapping("/profile")
    public Result<Void> updateProfile(@RequestBody Reader reader) {
        readerMapper.updateById(reader);
        return Result.success();
    }

    @GetMapping("/profile/{id}")
    public Result<Reader> getProfile(@PathVariable Integer id) {
        return Result.success(readerMapper.selectById(id));
    }
}
