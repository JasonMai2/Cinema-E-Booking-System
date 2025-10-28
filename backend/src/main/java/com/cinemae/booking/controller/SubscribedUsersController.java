package com.cinemae.booking.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api")
public class SubscribedUsersController {

    private final JdbcTemplate jdbc;

    @Autowired
    public SubscribedUsersController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/subscribed-users")
    public List<Map<String, Object>> getSubscribedUsers() {
        String sql = """
            SELECT u.id, u.first_name, u.last_name, u.email, ps.updated_at
            FROM users u
            JOIN promotion_subscriptions ps ON u.id = ps.user_id
            WHERE ps.subscribed = 1
        """;

        return jdbc.queryForList(sql);
    }
}
