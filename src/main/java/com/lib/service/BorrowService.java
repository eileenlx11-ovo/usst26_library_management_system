package com.lib.service;

import java.util.List;

public interface BorrowService {

    // 借阅处理
    void lendBook(Integer readerId, Integer bookId);

    // 归还处理
    void returnBook(Integer borrowId);

    // 逾期催还：返回需要通知的读者 ID 列表
    List<Integer> notifyOverdue();
}