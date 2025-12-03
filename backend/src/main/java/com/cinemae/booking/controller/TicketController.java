package com.cinemae.booking.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    @Autowired
    private JdbcTemplate jdbc;

    // -------------------------------
    // Model (Inline)
    // -------------------------------
    public static class TicketType {
        public Long id;
        public String name;
        public String ageCategory;
        public Integer priceCents;
        public Boolean active;
        public String createdAt;
        public String updatedAt;
    }

    // -------------------------------
    // DTOs (Inline)
    // -------------------------------
    public static class TicketTypeRequest {
        public String name;
        public String ageCategory;
        public Integer priceCents;
        public Boolean active;
    }

    // Row mapper
    private TicketType mapRow(ResultSet rs, int rowNum) throws SQLException {
        TicketType t = new TicketType();
        t.id = rs.getLong("id");
        t.name = rs.getString("name");
        t.ageCategory = rs.getString("age_category");
        t.priceCents = rs.getInt("price_cents");
        t.active = rs.getBoolean("is_active");
        t.createdAt = rs.getString("created_at");
        t.updatedAt = rs.getString("updated_at");
        return t;
    }

    // -------------------------------
    // GET ALL TICKET TYPES
    // -------------------------------
    @GetMapping
    public List<TicketType> getAllTickets() {
        String sql = "SELECT * FROM ticket_types ORDER BY id ASC";
        return jdbc.query(sql, this::mapRow);
    }

    // -------------------------------
    // GET SINGLE TICKET TYPE
    // -------------------------------
    @GetMapping("/{id}")
    public TicketType getTicket(@PathVariable Long id) {
        String sql = "SELECT * FROM ticket_types WHERE id = ?";
        return jdbc.query(sql, this::mapRow, id)
                   .stream()
                   .findFirst()
                   .orElseThrow(() -> new RuntimeException("Ticket type not found"));
    }

    // -------------------------------
    // CREATE TICKET TYPE
    // -------------------------------
    @PostMapping
    public Map<String, Object> createTicket(@RequestBody TicketTypeRequest req) {
        String sql = """
            INSERT INTO ticket_types (name, age_category, price_cents, is_active)
            VALUES (?, ?, ?, ?)
        """;

        jdbc.update(sql, req.name, req.ageCategory, req.priceCents,
                    req.active != null ? req.active : true);

        Map<String, Object> res = new HashMap<>();
        res.put("status", "success");
        res.put("message", "Ticket type created");
        return res;
    }

    // -------------------------------
    // UPDATE TICKET TYPE
    // -------------------------------
    @PutMapping("/{id}")
    public Map<String, Object> updateTicket(
            @PathVariable Long id,
            @RequestBody TicketTypeRequest req) {

        String sql = """
            UPDATE ticket_types
            SET name = ?, age_category = ?, price_cents = ?, is_active = ?
            WHERE id = ?
        """;

        int updated = jdbc.update(sql,
                req.name,
                req.ageCategory,
                req.priceCents,
                req.active != null ? req.active : true,
                id
        );

        if (updated == 0)
            throw new RuntimeException("Ticket type not found");

        Map<String, Object> res = new HashMap<>();
        res.put("status", "success");
        res.put("message", "Ticket type updated");
        return res;
    }

    // -------------------------------
    // DELETE TICKET TYPE
    // -------------------------------
    @DeleteMapping("/{id}")
    public Map<String, Object> deleteTicket(@PathVariable Long id) {
        String sql = "DELETE FROM ticket_types WHERE id = ?";

        int deleted = jdbc.update(sql, id);

        if (deleted == 0)
            throw new RuntimeException("Ticket type not found");

        Map<String, Object> res = new HashMap<>();
        res.put("status", "success");
        res.put("message", "Ticket type deleted");
        return res;
    }
}
