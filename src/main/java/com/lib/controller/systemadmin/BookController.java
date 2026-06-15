package com.lib.controller.systemadmin;

import com.lib.entity.Category;
import com.lib.mapper.CategoryMapper;
import com.lib.pojo.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController("systemadminBookController")
@RequestMapping("/systemadmin/book")
public class BookController {
    @Autowired private CategoryMapper categoryMapper;

    @GetMapping("/categories")
    public Result<List<Category>> list() { return Result.success(categoryMapper.selectList(null)); }

    @PostMapping("/category")
    public Result<Void> add(@RequestBody Category c) { categoryMapper.insert(c); return Result.success(); }

    @DeleteMapping("/category/{id}")
    public Result<Void> delete(@PathVariable Integer id) { categoryMapper.deleteById(id); return Result.success(); }
}
