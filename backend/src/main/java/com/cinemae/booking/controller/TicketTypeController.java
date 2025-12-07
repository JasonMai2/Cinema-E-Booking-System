package com.cinemae.booking.controller;

import java.sql.Timestamp;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for managing ticket types and pricing.
 * Allows administrators to view, create, update, and manage ticket categories and prices.
 */
@RestController
@RequestMapping("/api/ticket-types")
public class TicketTypeController {

    private final JdbcTemplate jdbc;

    @Autowired
    public TicketTypeController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * Get all ticket types with their prices.
     * This endpoint is used by the frontend to display available ticket categories.
     * Returns all ticket types (including inactive) for admin management.
     * 
     * @return List of ticket types with id, name, age_category, and price_cents
     */
    @GetMapping
    public List<Map<String, Object>> getAllTicketTypes() {
        try {
            List<Map<String, Object>> ticketTypes = jdbc.queryForList(
                "SELECT id, name, age_category, price_cents, is_active, created_at, updated_at " +
                "FROM ticket_types " +
                "ORDER BY is_active DESC, price_cents DESC"
            );
            return ticketTypes;
        } catch (Exception e) {
            // Return empty list on error - this allows the frontend to use fallback values
            return new java.util.ArrayList<>();
        }
    }

    /**
     * Get a specific ticket type by ID.
     * 
     * @param id The ticket type ID
     * @return Ticket type details
     */
    @GetMapping("/{id}")
    public Map<String, Object> getTicketType(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Map<String, Object> ticketType = jdbc.queryForMap(
                "SELECT id, name, age_category, price_cents, is_active, created_at, updated_at " +
                "FROM ticket_types WHERE id = ?",
                id
            );
            
            response.put("ok", true);
            response.put("ticketType", ticketType);
            return response;
        } catch (Exception e) {
            response.put("ok", false);
            response.put("message", "Ticket type not found");
            return response;
        }
    }

    /**
     * Create a new ticket type (Admin only).
     * 
     * @param payload Contains name, age_category, price_cents
     * @return Success or error message
     */
    @PostMapping
    public Map<String, Object> createTicketType(@RequestBody Map<String, Object> payload) {
        Map<String, Object> response = new HashMap<>();
        try {
            String name = (String) payload.get("name");
            String ageCategory = (String) payload.get("age_category");
            Integer priceCents = ((Number) payload.get("price_cents")).intValue();
            Boolean isActive = (Boolean) payload.getOrDefault("is_active", true);

            if (name == null || name.trim().isEmpty()) {
                response.put("ok", false);
                response.put("message", "Ticket type name is required");
                return response;
            }

            if (ageCategory == null || ageCategory.trim().isEmpty()) {
                response.put("ok", false);
                response.put("message", "Age category is required");
                return response;
            }

            if (priceCents == null || priceCents < 0) {
                response.put("ok", false);
                response.put("message", "Valid price is required");
                return response;
            }

            // Check if age_category already exists
            Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM ticket_types WHERE age_category = ? AND is_active = 1",
                Integer.class,
                ageCategory
            );

            if (count != null && count > 0) {
                response.put("ok", false);
                response.put("message", "Ticket type with this age category already exists");
                return response;
            }

            jdbc.update(
                "INSERT INTO ticket_types (name, age_category, price_cents, is_active, created_at, updated_at) " +
                "VALUES (?, ?, ?, ?, ?, ?)",
                name, ageCategory, priceCents, isActive,
                new Timestamp(System.currentTimeMillis()),
                new Timestamp(System.currentTimeMillis())
            );

            Long newId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
            
            response.put("ok", true);
            response.put("message", "Ticket type created successfully");
            response.put("id", newId);
            return response;
        } catch (Exception e) {
            response.put("ok", false);
            response.put("message", "Failed to create ticket type: " + e.getMessage());
            return response;
        }
    }

    /**
     * Update an existing ticket type (Admin only).
     * 
     * @param id The ticket type ID
     * @param payload Contains name, age_category, price_cents, is_active
     * @return Success or error message
     */
    @PutMapping("/{id}")
    public Map<String, Object> updateTicketType(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Map<String, Object> response = new HashMap<>();
        try {
            // Check if ticket type exists
            Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM ticket_types WHERE id = ?",
                Integer.class,
                id
            );

            if (count == null || count == 0) {
                response.put("ok", false);
                response.put("message", "Ticket type not found");
                return response;
            }

            String name = (String) payload.get("name");
            String ageCategory = (String) payload.get("age_category");
            Integer priceCents = payload.get("price_cents") != null ? 
                ((Number) payload.get("price_cents")).intValue() : null;
            Boolean isActive = (Boolean) payload.get("is_active");

            StringBuilder sql = new StringBuilder("UPDATE ticket_types SET updated_at = ?");
            List<Object> params = new java.util.ArrayList<>();
            params.add(new Timestamp(System.currentTimeMillis()));

            if (name != null && !name.trim().isEmpty()) {
                sql.append(", name = ?");
                params.add(name);
            }

            if (ageCategory != null && !ageCategory.trim().isEmpty()) {
                sql.append(", age_category = ?");
                params.add(ageCategory);
            }

            if (priceCents != null && priceCents >= 0) {
                sql.append(", price_cents = ?");
                params.add(priceCents);
            }

            if (isActive != null) {
                sql.append(", is_active = ?");
                params.add(isActive);
            }

            sql.append(" WHERE id = ?");
            params.add(id);

            jdbc.update(sql.toString(), params.toArray());

            response.put("ok", true);
            response.put("message", "Ticket type updated successfully");
            return response;
        } catch (Exception e) {
            response.put("ok", false);
            response.put("message", "Failed to update ticket type: " + e.getMessage());
            return response;
        }
    }

    /**
     * Deactivate a ticket type (soft delete - Admin only).
     * 
     * @param id The ticket type ID
     * @return Success or error message
     */
    @DeleteMapping("/{id}")
    public Map<String, Object> deleteTicketType(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            int updated = jdbc.update(
                "UPDATE ticket_types SET is_active = 0, updated_at = ? WHERE id = ?",
                new Timestamp(System.currentTimeMillis()),
                id
            );

            if (updated > 0) {
                response.put("ok", true);
                response.put("message", "Ticket type deactivated successfully");
            } else {
                response.put("ok", false);
                response.put("message", "Ticket type not found");
            }
            return response;
        } catch (Exception e) {
            response.put("ok", false);
            response.put("message", "Failed to delete ticket type: " + e.getMessage());
            return response;
        }
    }
}