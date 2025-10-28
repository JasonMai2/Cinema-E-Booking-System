package com.cinemae.booking.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;
import java.sql.Timestamp;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/payment-methods")
public class PaymentController {

    private final JdbcTemplate jdbc;
    private static final String ENCRYPTION_KEY = "123456";
    private static final String ALGORITHM = "AES";

    @Autowired
    public PaymentController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // Encryption helper methods
    private String encrypt(String plainText) {
        try {
            byte[] keyBytes = padKey(ENCRYPTION_KEY);
            SecretKeySpec secretKey = new SecretKeySpec(keyBytes, ALGORITHM);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey);
            byte[] encryptedBytes = cipher.doFinal(plainText.getBytes("UTF-8"));
            return Base64.getEncoder().encodeToString(encryptedBytes);
        } catch (Exception e) {
            throw new RuntimeException("Error encrypting data", e);
        }
    }

    private String decrypt(String encryptedText) {
        try {
            byte[] keyBytes = padKey(ENCRYPTION_KEY);
            SecretKeySpec secretKey = new SecretKeySpec(keyBytes, ALGORITHM);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey);
            byte[] decodedBytes = Base64.getDecoder().decode(encryptedText);
            byte[] decryptedBytes = cipher.doFinal(decodedBytes);
            return new String(decryptedBytes, "UTF-8");
        } catch (Exception e) {
            throw new RuntimeException("Error decrypting data", e);
        }
    }

    private byte[] padKey(String key) {
        byte[] keyBytes = new byte[16];
        byte[] sourceBytes = key.getBytes();
        int length = Math.min(sourceBytes.length, 16);
        System.arraycopy(sourceBytes, 0, keyBytes, 0, length);
        return keyBytes;
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
        
        // Decrypt sensitive fields for display
        List<Map<String, Object>> decryptedRows = rows.stream().map(row -> {
            Map<String, Object> decrypted = new HashMap<>(row);
            try {
                // Decrypt card number (stored in provider_token)
                if (row.get("provider_token") != null) {
                    String encryptedCardNumber = (String) row.get("provider_token");
                    String decryptedCardNumber = decrypt(encryptedCardNumber);
                    decrypted.put("provider_token", decryptedCardNumber);
                }
                
                // Decrypt CVV (stored in last4)
                if (row.get("last4") != null) {
                    String encryptedCvv = (String) row.get("last4");
                    String decryptedCvv = decrypt(encryptedCvv);
                    decrypted.put("last4", decryptedCvv);
                }
            } catch (Exception e) {
                System.err.println("Error decrypting payment method " + row.get("id") + ": " + e.getMessage());
                // Return original if decryption fails (for backwards compatibility)
            }
            return decrypted;
        }).collect(Collectors.toList());
        
        resp.put("ok", true);
        resp.put("methods", decryptedRows);
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

            // Encrypt sensitive data before storing
            String encryptedToken = encrypt(token);
            String encryptedLast4 = last4 != null ? encrypt(last4) : null;

            jdbc.update("INSERT INTO payment_methods (user_id, provider, provider_token, brand, last4, exp_month, exp_year, billing_address, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
                    uid.longValue(), provider, encryptedToken, brand, encryptedLast4, expMonth == null ? null : expMonth.intValue(), expYear == null ? null : expYear.intValue(), billing, new Timestamp(System.currentTimeMillis()), new Timestamp(System.currentTimeMillis()));

            Long insertedId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
            Map<String, Object> method = jdbc.queryForMap("SELECT id, provider, provider_token, brand, last4, exp_month, exp_year, is_default, billing_address, created_at FROM payment_methods WHERE id = ?", insertedId);

            // Decrypt for response
            method.put("provider_token", token);
            method.put("last4", last4);

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

            String billing = (String) payload.getOrDefault("billing_address", null);
            String brand = (String) payload.getOrDefault("brand", null);
            String providerToken = (String) payload.getOrDefault("provider_token", null);
            String last4 = (String) payload.getOrDefault("last4", null);
            Number expMonth = (Number) payload.getOrDefault("exp_month", null);
            Number expYear = (Number) payload.getOrDefault("exp_year", null);

            StringBuilder updateQuery = new StringBuilder("UPDATE payment_methods SET ");
            boolean first = true;

            if (billing != null) {
                updateQuery.append("billing_address = ?");
                first = false;
            }
            if (brand != null) {
                if (!first) {
                    updateQuery.append(", ");
                }
                updateQuery.append("brand = ?");
                first = false;
            }
            if (providerToken != null) {
                if (!first) {
                    updateQuery.append(", ");
                }
                updateQuery.append("provider_token = ?");
                first = false;
            }
            if (last4 != null) {
                if (!first) {
                    updateQuery.append(", ");
                }
                updateQuery.append("last4 = ?");
                first = false;
            }
            if (expMonth != null) {
                if (!first) {
                    updateQuery.append(", ");
                }
                updateQuery.append("exp_month = ?");
                first = false;
            }
            if (expYear != null) {
                if (!first) {
                    updateQuery.append(", ");
                }
                updateQuery.append("exp_year = ?");
                first = false;
            }

            if (!first) {
                updateQuery.append(", ");
            }
            updateQuery.append("updated_at = ? WHERE id = ?");

            java.util.ArrayList<Object> params = new java.util.ArrayList<>();
            if (billing != null) {
                params.add(billing);
            }
            if (brand != null) {
                params.add(brand);
            }
            if (providerToken != null) {
                // Encrypt before storing
                params.add(encrypt(providerToken));
            }
            if (last4 != null) {
                // Encrypt before storing
                params.add(encrypt(last4));
            }
            if (expMonth != null) {
                params.add(expMonth.intValue());
            }
            if (expYear != null) {
                params.add(expYear.intValue());
            }
            params.add(new Timestamp(System.currentTimeMillis()));
            params.add(id);

            String finalQuery = updateQuery.toString();
            jdbc.update(finalQuery, params.toArray());

            Map<String, Object> method = jdbc.queryForMap("SELECT id, provider, provider_token, brand, last4, exp_month, exp_year, is_default, billing_address, created_at, updated_at FROM payment_methods WHERE id = ?", id);

            // Decrypt for response
            try {
                if (method.get("provider_token") != null) {
                    String encryptedCardNumber = (String) method.get("provider_token");
                    method.put("provider_token", decrypt(encryptedCardNumber));
                }
                if (method.get("last4") != null) {
                    String encryptedCvv = (String) method.get("last4");
                    method.put("last4", decrypt(encryptedCvv));
                }
            } catch (Exception e) {
                System.err.println("Error decrypting updated payment method: " + e.getMessage());
            }

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
