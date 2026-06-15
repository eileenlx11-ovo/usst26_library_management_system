package com.lib.service;

import java.util.List;
import java.util.Map;

public interface ToolService {
    List<Map<String,Object>> hotBooks();
    List<Map<String,Object>> activeReaders();
    List<Map<String,Object>> overdueList();
}
