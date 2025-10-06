package com.cinemae.booking.health;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Autowired;
import javax.sql.DataSource;
import java.sql.Connection;

@RestController
public class HealthController {
    @Autowired
    private DataSource dataSource;

    @GetMapping("/db/ping")
    public String pingDb() {
        try (Connection c = dataSource.getConnection()) {
            return "OK - user: " + c.getMetaData().getUserName() + " | catalog: " + c.getCatalog();
        } catch (Exception e) {
            return "DB ERROR: " + e.getMessage();
        }
    }
}
