package com.cinemae.booking.controller;

import java.util.List;
import java.util.Map;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/promotions")
public class PromotionController {
    
    private final JdbcTemplate jdbc;

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

    // Validate a promo code and return details
    @PostMapping("/validate")
    public Map<String, Object> validatePromoCode(@RequestBody Map<String, Object> payload) {
        String code = (String) payload.get("code");
        Integer subtotalCents = payload.get("subtotalCents") != null ? ((Number) payload.get("subtotalCents")).intValue() : 0;

        if (code == null || code.trim().isEmpty()) {
            return Map.of(
                "valid", false,
                "message", "Please enter a promo code"
            );
        }

        try {
            // Fetch promotion + code data
            String sql = """
                SELECT pc.id AS code_id, pc.promotion_id, pc.code, pc.max_redemptions, pc.redeemed_count,
                       p.name, p.description, p.percent_off, p.flat_off_cents,
                       p.starts_at, p.ends_at, p.active
                FROM promotion_codes pc
                JOIN promotions p ON pc.promotion_id = p.id
                WHERE pc.code = ?
                """;
            Map<String, Object> result = jdbc.queryForMap(sql, code.trim());

            String name = (String) result.get("name");
            String description = (String) result.get("description");
            Boolean active = (Boolean) result.get("active");
            
            java.time.LocalDateTime startsAt = (java.time.LocalDateTime) result.get("starts_at");
            java.time.LocalDateTime endsAt = (java.time.LocalDateTime) result.get("ends_at");
            
            Integer maxRedemptions = result.get("max_redemptions") != null
                ? ((Number) result.get("max_redemptions")).intValue()
                : null;
            Integer redeemedCount = ((Number) result.get("redeemed_count")).intValue();

            // Validate active status
            if (!active) {
                return Map.of(
                    "valid", false,
                    "message", "This promotion is currently inactive"
                );
            }

            java.time.LocalDateTime now = java.time.LocalDateTime.now();

            // Validate date range
            if (now.isBefore(startsAt)) {
                return Map.of(
                    "valid", false,
                    "message", "This promotion has not started yet"
                );
            }
            if (now.isAfter(endsAt)) {
                return Map.of(
                    "valid", false,
                    "message", "This promotion has expired"
                );
            }

            // Validate redemption limits
            if (maxRedemptions != null && redeemedCount >= maxRedemptions) {
                return Map.of(
                    "valid", false,
                    "message", "This promo code has reached its maximum redemptions"
                );
            }

            // Calculate discount
            Double percentOff = result.get("percent_off") != null
                ? ((Number) result.get("percent_off")).doubleValue()
                : null;
            Integer flatOffCents = result.get("flat_off_cents") != null
                ? ((Number) result.get("flat_off_cents")).intValue()
                : null;

            int discountCents = 0;
            String discountDescription = "";

            if (percentOff != null && percentOff > 0) {
                discountCents = (int) Math.round(subtotalCents * (percentOff / 100.0));
                discountDescription = percentOff + "% off";
            } else if (flatOffCents != null && flatOffCents > 0) {
                discountCents = Math.min(flatOffCents, subtotalCents);
                discountDescription = "$" + String.format("%.2f", flatOffCents / 100.0) + " off";
            }

            return Map.of(
                "valid", true,
                "name", name,
                "description", description != null ? description : "",
                "discountDescription", discountDescription,
                "discountCents", discountCents,
                "percentOff", percentOff != null ? percentOff : 0,
                "flatOffCents", flatOffCents != null ? flatOffCents : 0
            );

        } catch (EmptyResultDataAccessException e) {
            return Map.of(
                "valid", false,
                "message", "Invalid promo code"
            );
        } catch (Exception e) {
            return Map.of(
                "valid", false,
                "message", "Error validating promo code: " + e.getMessage()
            );
        }
    }
}
