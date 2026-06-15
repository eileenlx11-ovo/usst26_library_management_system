package com.lib.service;

import com.lib.entity.Reader;
import java.util.List;

public interface ReaderService {
    List<Reader> list(String keyword);
    void add(Reader reader);
    void update(Reader reader);
    void delete(Integer id);
}
