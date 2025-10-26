package com.cinemae.booking.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final JdbcTemplate jdbc;

    @Autowired
    public UserController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // Get all users
    @GetMapping
    public List<Map<String, Object>> getAllUsers() {
        String sql = """
            SELECT 
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                u.phone,
                u.is_suspended,
                u.created_at,
                r.name AS role
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.id
            ORDER BY u.id DESC
        """;
        return jdbc.queryForList(sql);
    }

    // Get user by ID
    @GetMapping("/{id}")
    public Map<String, Object> getUserById(@PathVariable Long id) {
        try {
            String sql = """
                SELECT 
                    u.id,
                    u.first_name,
                    u.last_name,
                    u.email,
                    u.phone,
                    u.is_suspended,
                    u.created_at,
                    r.name AS role
                FROM users u
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
                WHERE u.id = ?
            """;
            return jdbc.queryForMap(sql, id);
        } catch (EmptyResultDataAccessException e) {
            return Map.of("error", "User not found");
        }
    }

    // Update existing user
    @PutMapping("/{id}")
    public Map<String, Object> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        String firstName = (String) payload.get("first_name");
        String lastName = (String) payload.get("last_name");
        String email = (String) payload.get("email");
        String phone = (String) payload.get("phone");
        Boolean isSuspended = (Boolean) payload.getOrDefault("is_suspended", false);
        String role = (String) payload.get("role"); // expects "admin" or "registered"

        // Update basic user info
        int updated = jdbc.update("""
            UPDATE users
            SET first_name = ?, last_name = ?, email = ?, phone = ?, is_suspended = ?
            WHERE id = ?
        """, firstName, lastName, email, phone, isSuspended ? 1 : 0, id);

        if (updated == 0) {
            return Map.of("error", "User not found");
        }

        // Update role
        if (role != null) {
            // 1 → admin, 2 → registered
            int roleId = role.equalsIgnoreCase("admin") ? 1 : 2;

            // Remove old role
            jdbc.update("DELETE FROM user_roles WHERE user_id = ?", id);

            // Insert new role
            jdbc.update("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)", id, roleId);
        }

        return Map.of("status", "User updated successfully");
    }

    // Delete user
    @DeleteMapping("/{id}")
    public Map<String, Object> deleteUser(@PathVariable Long id) {
        int deleted = jdbc.update("DELETE FROM users WHERE id = ?", id);
        if (deleted == 0) {
            return Map.of("error", "User not found");
        }
        return Map.of("status", "User deleted successfully");
    }
}
