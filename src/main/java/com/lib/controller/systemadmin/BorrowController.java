package com.lib.controller.systemadmin;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.lib.mapper.RuleMapper;
import com.lib.pojo.Result;
import com.lib.pojo.Rule;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController("systemadminBorrowController")
@RequestMapping("/systemadmin/borrow")
public class BorrowController {
    @Autowired private RuleMapper ruleMapper;

    @GetMapping("/rules")
    public Result<List<Rule>> list() {
        return Result.success(ruleMapper.selectList(
            new QueryWrapper<Rule>().groupBy("reader_type").orderByAsc("rule_id")));
    }

    @GetMapping("/rule/{type}")
    public Result<Rule> getByType(@PathVariable String type) {
        return Result.success(ruleMapper.selectOne(
            new QueryWrapper<Rule>().eq("reader_type", type).last("limit 1")));
    }

    @PostMapping("/rule")
    public Result<Void> save(@RequestBody Rule rule) {
        Rule existing = ruleMapper.selectOne(
            new QueryWrapper<Rule>().eq("reader_type", rule.getReaderType()).last("limit 1"));
        if (existing != null) { rule.setRuleId(existing.getRuleId()); ruleMapper.updateById(rule); }
        else ruleMapper.insert(rule);
        return Result.success();
    }
}
