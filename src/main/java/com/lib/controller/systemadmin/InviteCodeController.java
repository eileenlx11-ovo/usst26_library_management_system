package com.lib.controller.systemadmin;

import com.lib.entity.InviteCode;
import com.lib.mapper.InviteCodeMapper;
import com.lib.pojo.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;

@RestController("systemadminInviteCodeController")
@RequestMapping("/systemadmin/invite")
public class InviteCodeController {
    @Autowired private InviteCodeMapper inviteCodeMapper;

    @GetMapping("/list")
    public Result<List<InviteCode>> list() {
        return Result.success(inviteCodeMapper.selectList(null));
    }

    @PostMapping("/generate")
    public Result<?> generate(@RequestParam String role, @RequestParam(defaultValue = "1") int maxUses,
                               @RequestParam(defaultValue = "30") int expireDays) {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 8; i++) sb.append(chars.charAt((int)(Math.random() * chars.length())));
        InviteCode ic = new InviteCode();
        ic.setCode(sb.toString());
        ic.setRole(role);
        ic.setIsUsed(false);
        ic.setCreateTime(LocalDateTime.now());
        ic.setExpireTime(LocalDateTime.now().plusDays(expireDays));
        inviteCodeMapper.insert(ic);
        Map<String,Object> r = new LinkedHashMap<>();
        r.put("code", ic.getCode()); r.put("codeId", ic.getCodeId());
        return Result.success(r);
    }

    @PutMapping("/revoke/{id}")
    public Result<?> revoke(@PathVariable Integer id) {
        InviteCode ic = inviteCodeMapper.selectById(id);
        if (ic != null) { ic.setIsUsed(true); inviteCodeMapper.updateById(ic); }
        return Result.success("已吊销");
    }
}
