package com.cinemae.booking.controller;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class AdminController {

    private static final Logger log = LoggerFactory.getLogger(AdminController.class);
    private final JdbcTemplate jdbc;

    public AdminController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * Get current fee settings (service fee and tax rate)
     */
    @GetMapping("/fees")
    public ResponseEntity<Map<String, Object>> getFeeSettings() {
        log.info("Getting fee settings");
        
        Map<String, Object> settings = new HashMap<>();
        
        try {
            // Get service fee from settings table
            Integer serviceFeeCents = null;
            try {
                serviceFeeCents = jdbc.queryForObject(
                    "SELECT value_int FROM settings WHERE setting_key = 'service_fee_cents'",
                    Integer.class
                );
            } catch (Exception e) {
                log.warn("service_fee_cents not found in settings, using default");
            }
            
            // Get tax rate from settings table
            Double taxRate = null;
            try {
                taxRate = jdbc.queryForObject(
                    "SELECT value_decimal FROM settings WHERE setting_key = 'tax_rate_percent'",
                    Double.class
                );
            } catch (Exception e) {
                log.warn("tax_rate_percent not found in settings, using default");
            }
            
            // Use defaults if not found
            settings.put("serviceFee", serviceFeeCents != null ? serviceFeeCents : 150); // $1.50 default
            settings.put("taxRate", taxRate != null ? taxRate : 8.0); // 8% default
            settings.put("ok", true);
            
            return ResponseEntity.ok(settings);
            
        } catch (Exception e) {
            log.error("Failed to get fee settings", e);
            return ResponseEntity.ok(Map.of(
                "ok", false,
                "serviceFee", 150,
                "taxRate", 8.0,
                "message", "Using default values"
            ));
        }
    }

    /**
     * Update fee settings
     */
    @PutMapping("/fees")
    public ResponseEntity<Map<String, Object>> updateFeeSettings(@RequestBody Map<String, Object> payload) {
        log.info("Updating fee settings: {}", payload);
        
        try {
            Integer serviceFeeCents = payload.get("serviceFeeCents") != null 
                ? ((Number) payload.get("serviceFeeCents")).intValue() 
                : null;
            Double taxRatePercent = payload.get("taxRatePercent") != null 
                ? ((Number) payload.get("taxRatePercent")).doubleValue() 
                : null;
            
            // Ensure settings table exists
            jdbc.execute("""
                CREATE TABLE IF NOT EXISTS settings (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    setting_key VARCHAR(100) NOT NULL UNIQUE,
                    value_int INT NULL,
                    value_decimal DECIMAL(10,4) NULL,
                    value_string VARCHAR(500) NULL,
                    description VARCHAR(500) NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            """);
            
            // Update or insert service fee
            if (serviceFeeCents != null) {
                int updated = jdbc.update(
                    "UPDATE settings SET value_int = ? WHERE setting_key = 'service_fee_cents'",
                    serviceFeeCents
                );
                if (updated == 0) {
                    jdbc.update(
                        "INSERT INTO settings (setting_key, value_int, description) VALUES (?, ?, ?)",
                        "service_fee_cents", serviceFeeCents, "Service fee per ticket in cents"
                    );
                }
                log.info("Updated service fee to {} cents", serviceFeeCents);
            }
            
            // Update or insert tax rate
            if (taxRatePercent != null) {
                int updated = jdbc.update(
                    "UPDATE settings SET value_decimal = ? WHERE setting_key = 'tax_rate_percent'",
                    taxRatePercent
                );
                if (updated == 0) {
                    jdbc.update(
                        "INSERT INTO settings (setting_key, value_decimal, description) VALUES (?, ?, ?)",
                        "tax_rate_percent", taxRatePercent, "Sales tax rate as percentage"
                    );
                }
                log.info("Updated tax rate to {}%", taxRatePercent);
            }
            
            return ResponseEntity.ok(Map.of(
                "ok", true,
                "message", "Settings updated successfully"
            ));
            
        } catch (Exception e) {
            log.error("Failed to update fee settings", e);
            return ResponseEntity.badRequest().body(Map.of(
                "ok", false,
                "message", "Failed to update settings: " + e.getMessage()
            ));
        }
    }
}