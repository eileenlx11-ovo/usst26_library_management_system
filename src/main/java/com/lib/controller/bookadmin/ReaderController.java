package com.lib.controller.bookadmin;

import com.lib.entity.Reader;
import com.lib.pojo.Result;
import com.lib.service.ReaderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController("bookadminReaderController")
@RequestMapping("/bookadmin/reader")
public class ReaderController {
    @Autowired private ReaderService readerService;

    @GetMapping("/list")
    public Result<List<Reader>> list(@RequestParam(defaultValue = "") String keyword) {
        return Result.success(readerService.list(keyword));
    }

    @PostMapping
    public Result<Void> add(@RequestBody Reader reader) {
        readerService.add(reader);
        return Result.success();
    }

    @PutMapping
    public Result<Void> update(@RequestBody Reader reader) {
        readerService.update(reader);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Integer id) {
        readerService.delete(id);
        return Result.success();
    }
}
