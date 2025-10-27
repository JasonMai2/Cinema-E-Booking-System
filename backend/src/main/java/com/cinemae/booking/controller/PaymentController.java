package com.cinemae.booking.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.sql.Timestamp;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payment-methods")
public class PaymentController {

    private final JdbcTemplate jdbc;

    @Autowired
    public PaymentController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // List payment methods for a user. In real app use authenticated principal; here accept userId param for simplicity.
    @GetMapping
    public Map<String, Object> list(@RequestParam(name = "userId", required = false) Long userId) {
        Map<String, Object> resp = new HashMap<>();
        if (userId == null) {
            resp.put("ok", false);
            resp.put("message", "userId required (in dev mode)");
            return resp;
        }
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT id, provider, provider_token, brand, last4, exp_month, exp_year, is_default, billing_address, created_at FROM payment_methods WHERE user_id = ? ORDER BY created_at DESC", userId);
        resp.put("ok", true);
        resp.put("methods", rows);
        return resp;
    }

    // Add a payment method (store provider token and metadata)
    @PostMapping
    public Map<String, Object> add(@RequestBody Map<String, Object> payload) {
        Map<String, Object> resp = new HashMap<>();
        try {
            Number uid = (Number) payload.get("user_id");
            String provider = (String) payload.getOrDefault("provider", "dev");
            String token = (String) payload.get("provider_token");
            String brand = (String) payload.getOrDefault("brand", null);
            String last4 = (String) payload.getOrDefault("last4", null);
            Number expMonth = (Number) payload.getOrDefault("exp_month", null);
            Number expYear = (Number) payload.getOrDefault("exp_year", null);
            String billing = (String) payload.getOrDefault("billing_address", null);

            if (uid == null || token == null || token.isBlank()) {
                resp.put("ok", false);
                resp.put("message", "user_id and provider_token are required");
                return resp;
            }

            // enforce maximum of 3 payment methods per user (dev-mode)
            Integer existing = jdbc.queryForObject("SELECT COUNT(*) FROM payment_methods WHERE user_id = ?", Integer.class, uid.longValue());
            if (existing != null && existing >= 3) {
                resp.put("ok", false);
                resp.put("message", "limit reached: a user may have up to 3 payment methods");
                resp.put("limit", 3);
                resp.put("current", existing);
                return resp;
            }

            jdbc.update("INSERT INTO payment_methods (user_id, provider, provider_token, brand, last4, exp_month, exp_year, billing_address, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
                    uid.longValue(), provider, token, brand, last4, expMonth == null ? null : expMonth.intValue(), expYear == null ? null : expYear.intValue(), billing, new Timestamp(System.currentTimeMillis()), new Timestamp(System.currentTimeMillis()));

            Long insertedId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
            Map<String, Object> method = jdbc.queryForMap("SELECT id, provider, provider_token, brand, last4, exp_month, exp_year, is_default, billing_address, created_at FROM payment_methods WHERE id = ?", insertedId);

            resp.put("ok", true);
            resp.put("message", "saved");
            resp.put("method", method);
            return resp;
        } catch (Exception e) {
            e.printStackTrace();
            resp.put("ok", false);
            resp.put("message", "error: " + e.getMessage());
            return resp;
        }
    }

    @PutMapping("/{id}")
    public Map<String, Object> update(@PathVariable("id") Long id, @RequestBody Map<String, Object> payload) {
        Map<String, Object> resp = new HashMap<>();
        try {
            Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM payment_methods WHERE id = ?", Integer.class, id);
            if (count == null || count == 0) {
                resp.put("ok", false);
                resp.put("message", "Payment method not found");
                return resp;
            }

            // Only allow updating billing_address for security
            String billing = (String) payload.getOrDefault("billing_address", null);

            if (billing == null) {
                resp.put("ok", false);
                resp.put("message", "billing_address is required");
                return resp;
            }

            jdbc.update("UPDATE payment_methods SET billing_address = ?, updated_at = ? WHERE id = ?",
                    billing, new Timestamp(System.currentTimeMillis()), id);

            Map<String, Object> method = jdbc.queryForMap("SELECT id, provider, provider_token, brand, last4, exp_month, exp_year, is_default, billing_address, created_at, updated_at FROM payment_methods WHERE id = ?", id);

            resp.put("ok", true);
            resp.put("message", "updated");
            resp.put("method", method);
            return resp;
        } catch (Exception e) {
            e.printStackTrace();
            resp.put("ok", false);
            resp.put("message", "error: " + e.getMessage());
            return resp;
        }
    }

    // Delete a payment method by id (dev mode no auth check)
    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable("id") Long id) {
        Map<String, Object> resp = new HashMap<>();
        try {
            int deleted = jdbc.update("DELETE FROM payment_methods WHERE id = ?", id);
            resp.put("ok", true);
            resp.put("deleted", deleted);
            return resp;
        } catch (Exception e) {
            e.printStackTrace();
            resp.put("ok", false);
            resp.put("message", e.getMessage());
            return resp;
        }
    }
}
