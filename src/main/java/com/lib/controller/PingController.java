package com.lib.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.*;

@RestController
public class PingController {
    @GetMapping("/ping")
    public Map<String,Object> ping() {
        Map<String,Object> m = new HashMap<>();
        m.put("ok", true);
        m.put("time", System.currentTimeMillis());
        return m;
    }
}
