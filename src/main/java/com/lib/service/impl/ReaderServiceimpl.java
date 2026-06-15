package com.lib.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.lib.entity.Reader;
import com.lib.mapper.ReaderMapper;
import com.lib.service.ReaderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ReaderServiceimpl implements ReaderService {
    @Autowired private ReaderMapper readerMapper;

    @Override
    public List<Reader> list(String keyword) {
        if (keyword != null && !keyword.isEmpty()) return readerMapper.search(keyword);
        return readerMapper.selectList(new QueryWrapper<>());
    }

    @Override
    public void add(Reader reader) { readerMapper.insert(reader); }

    @Override
    public void update(Reader reader) { readerMapper.updateById(reader); }

    @Override
    public void delete(Integer id) { readerMapper.deleteById(id); }
}
