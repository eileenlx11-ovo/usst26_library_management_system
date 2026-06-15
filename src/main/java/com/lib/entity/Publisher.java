package com.lib.entity;


import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Publisher {
    private Integer publisherId;
    private String publisherName;
    private String address;
    private String phone;
}