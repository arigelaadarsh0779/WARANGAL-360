package com.warangal360.cityfix;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CityFixApplication {
    public static void main(String[] args) {
        SpringApplication.run(CityFixApplication.class, args);
    }
}
