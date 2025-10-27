package com.cinemae.booking.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/promotions")
public class PromotionController {
    
    private final JdbcTemplate jdbc;

    @Autowired
    public PromotionController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // Get all promotions
    @GetMapping
    public List<Map<String, Object>> getAllPromotions() {
        String sql = "SELECT * FROM promotions ORDER BY starts_at DESC";
        return jdbc.queryForList(sql);
    }

    // Get a single promotion by ID, including codes
    @GetMapping("/{id}")
    public Map<String, Object> getPromotionById(@PathVariable Long id) {
        try {
            String promoSql = "SELECT * FROM promotions WHERE id = ?";
            Map<String, Object> promotion = jdbc.queryForMap(promoSql, id);

            // Get associated codes
            String codesSql = "SELECT * FROM promotion_codes WHERE promotion_id = ?";
            List<Map<String, Object>> codes = jdbc.queryForList(codesSql, id);
            promotion.put("codes", codes);

            return promotion;
        } catch (EmptyResultDataAccessException e) {
            return Map.of("error", "Promotion not found");
        }
    }

    // Create a new promotion
    @PostMapping
    public Map<String, Object> createPromotion(@RequestBody Map<String, Object> payload) {
        String name = (String) payload.get("name");
        String description = (String) payload.getOrDefault("description", "");
        Double percentOff = payload.get("percent_off") != null ? ((Number) payload.get("percent_off")).doubleValue() : null;
        Integer flatOff = payload.get("flat_off_cents") != null ? ((Number) payload.get("flat_off_cents")).intValue() : null;
        String startsAt = (String) payload.get("starts_at");
        String endsAt = (String) payload.get("ends_at");
        Boolean active = payload.get("active") != null ? (Boolean) payload.get("active") : true;

        int inserted = jdbc.update(
            "INSERT INTO promotions (name, description, percent_off, flat_off_cents, starts_at, ends_at, active) VALUES (?, ?, ?, ?, ?, ?, ?)",
            name, description, percentOff, flatOff, startsAt, endsAt, active ? 1 : 0
        );

        if (inserted > 0) {
            return Map.of("status", "Promotion created successfully");
        } else {
            return Map.of("error", "Failed to create promotion");
        }
    }

    // Update an existing promotion
    @PutMapping("/{id}")
    public Map<String, Object> updatePromotion(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        String name = (String) payload.get("name");
        String description = (String) payload.getOrDefault("description", "");
        Double percentOff = payload.get("percent_off") != null ? ((Number) payload.get("percent_off")).doubleValue() : null;
        Integer flatOff = payload.get("flat_off_cents") != null ? ((Number) payload.get("flat_off_cents")).intValue() : null;
        String startsAt = (String) payload.get("starts_at");
        String endsAt = (String) payload.get("ends_at");
        Boolean active = payload.get("active") != null ? (Boolean) payload.get("active") : true;

        int updated = jdbc.update(
            "UPDATE promotions SET name = ?, description = ?, percent_off = ?, flat_off_cents = ?, starts_at = ?, ends_at = ?, active = ? WHERE id = ?",
            name, description, percentOff, flatOff, startsAt, endsAt, active ? 1 : 0, id
        );

        if (updated > 0) {
            return Map.of("status", "Promotion updated successfully");
        } else {
            return Map.of("error", "Promotion not found");
        }
    }

    // Delete a promotion
    @DeleteMapping("/{id}")
    public Map<String, Object> deletePromotion(@PathVariable Long id) {
        int deleted = jdbc.update("DELETE FROM promotions WHERE id = ?", id);
        if (deleted > 0) {
            return Map.of("status", "Promotion deleted successfully");
        } else {
            return Map.of("error", "Promotion not found");
        }
    }

    // Add a code to a promotion
    @PostMapping("/{id}/codes")
    public Map<String, Object> addCode(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        String code = (String) payload.get("code");
        Integer maxRedemptions = payload.get("max_redemptions") != null ? ((Number) payload.get("max_redemptions")).intValue() : null;

        jdbc.update(
            "INSERT INTO promotion_codes (promotion_id, code, max_redemptions) VALUES (?, ?, ?)",
            id, code, maxRedemptions
        );

        return Map.of("status", "Code added successfully");
    }

    // Delete a code
    @DeleteMapping("/codes/{codeId}")
    public Map<String, Object> deleteCode(@PathVariable Long codeId) {
        int deleted = jdbc.update("DELETE FROM promotion_codes WHERE id = ?", codeId);
        if (deleted > 0) {
            return Map.of("status", "Code deleted successfully");
        } else {
            return Map.of("error", "Code not found");
        }
    }
}
