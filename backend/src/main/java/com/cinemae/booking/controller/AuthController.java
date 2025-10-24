package com.cinemae.booking.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletRequest;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import java.util.Random;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final JdbcTemplate jdbc;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Autowired
    public AuthController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody(required = false) Map<String, Object> payload,
                                        HttpServletRequest request) {
        Map<String, Object> resp = new HashMap<>();
        try {
            // Defensive parsing: if Spring couldn't bind the JSON (payload == null),
            // try to read the raw request body and parse JSON or urlencoded form data.
            if (payload == null) {
                String raw = request.getReader().lines().collect(Collectors.joining());
                if (raw != null && !raw.isBlank()) {
                    raw = raw.trim();
                    // If it looks like JSON, parse it
                    if (raw.startsWith("{")) {
                        ObjectMapper om = new ObjectMapper();
                        payload = om.readValue(raw, new TypeReference<Map<String, Object>>() {
                        });
                    } else if (raw.contains("=")) {
                        // parse application/x-www-form-urlencoded bodies like "email=...&password=..."
                        Map<String, Object> form = new HashMap<>();
                        String[] pairs = raw.split("&");
                        for (String pair : pairs) {
                            String[] kv = pair.split("=", 2);
                            String k = URLDecoder.decode(kv[0], StandardCharsets.UTF_8);
                            String v = kv.length > 1 ? URLDecoder.decode(kv[1], StandardCharsets.UTF_8) : "";
                            form.put(k, v);
                        }
                        payload = form;
                    }
                }
            }

            // accept either 'name' (legacy full name) or explicit first_name/last_name
            String name = (String) payload.get("name");
            String firstName = (String) payload.get("first_name");
            String lastName = (String) payload.get("last_name");
            String email = (String) payload.get("email");
            String password = (String) payload.get("password");
            String phone = (String) payload.getOrDefault("phone", null);
            Boolean subscribeToPromotions = (Boolean) payload.getOrDefault("subscribe_to_promotions", false);
            
            // Optional address information
            Map<String, Object> homeAddress = (Map<String, Object>) payload.get("home_address");
            Map<String, Object> shippingAddress = (Map<String, Object>) payload.get("shipping_address");
            
            // Optional payment cards (max 3)
            List<Map<String, Object>> paymentCards = (List<Map<String, Object>>) payload.getOrDefault("payment_cards", new ArrayList<>());

            // require either a name or firstName
            String storeFirst = firstName;
            if ((storeFirst == null || storeFirst.isBlank()) && name != null) {
                // try to split full name into first/last
                String[] parts = name.trim().split("\\s+", 2);
                storeFirst = parts[0];
                if (parts.length > 1 && (lastName == null || lastName.isBlank())) {
                    lastName = parts[1];
                }
            }

            if (storeFirst == null || storeFirst.isBlank() || email == null || email.isBlank() || password == null || password.isBlank()) {
                resp.put("ok", false);
                resp.put("message", "first name, email and password are required");
                return resp;
            }

            // Phone is now required per specifications
            if (phone == null || phone.isBlank()) {
                resp.put("ok", false);
                resp.put("message", "phone number is required");
                return resp;
            }

            // Validate payment cards limit (max 3)
            if (paymentCards != null && paymentCards.size() > 3) {
                resp.put("ok", false);
                resp.put("message", "Maximum 3 payment cards allowed");
                return resp;
            }

            // Check existing email
            Integer exists = jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE email = ?", Integer.class, email);
            if (exists != null && exists > 0) {
                resp.put("ok", false);
                resp.put("message", "Email already registered");
                return resp;
            }

            // store the bcrypt hash as UTF-8 bytes into varbinary column
            String hashed = passwordEncoder.encode(password);
            byte[] hash = hashed.getBytes(java.nio.charset.StandardCharsets.UTF_8);

            // Insert user with inactive status (requires email verification)
            jdbc.update("INSERT INTO users (email, password_hash, first_name, last_name, phone, created_at, updated_at) VALUES (?,?,?,?,?,?,?)",
                email, hash, storeFirst, lastName, phone, new Timestamp(System.currentTimeMillis()), new Timestamp(System.currentTimeMillis()));

            // Get the user ID for additional data
            Long userId = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);

            // Handle promotion subscription
            if (subscribeToPromotions != null && subscribeToPromotions) {
                jdbc.update("INSERT INTO promotion_subscriptions (user_id, subscribed) VALUES (?, ?)", userId, true);
            }

            // Handle home address if provided
            if (homeAddress != null && homeAddress.get("street") != null && !((String)homeAddress.get("street")).isBlank()) {
                jdbc.update("INSERT INTO addresses (user_id, type, street, city, state, postal_code) VALUES (?, 'HOME', ?, ?, ?, ?)",
                    userId, homeAddress.get("street"), homeAddress.get("city"), homeAddress.get("state"), homeAddress.get("zipCode"));
            }

            // Handle shipping address if provided (max 1)
            if (shippingAddress != null && shippingAddress.get("street") != null && !((String)shippingAddress.get("street")).isBlank()) {
                jdbc.update("INSERT INTO addresses (user_id, type, street, city, state, postal_code) VALUES (?, 'SHIPPING', ?, ?, ?, ?)",
                    userId, shippingAddress.get("street"), shippingAddress.get("city"), shippingAddress.get("state"), shippingAddress.get("zipCode"));
            }

            // Handle payment cards if provided (max 3)
            if (paymentCards != null && !paymentCards.isEmpty()) {
                for (Map<String, Object> card : paymentCards) {
                    if (card.get("cardNumber") != null && card.get("cardType") != null) {
                        // Store payment card info (in a real app, this would be tokenized)
                        Map<String, Object> billingAddr = (Map<String, Object>) card.get("billingAddress");
                        String billingAddressJson = null;
                        if (billingAddr != null) {
                            // Simple JSON serialization for billing address
                            billingAddressJson = String.format("{\"street\":\"%s\",\"city\":\"%s\",\"state\":\"%s\",\"zipCode\":\"%s\"}",
                                billingAddr.getOrDefault("street", ""),
                                billingAddr.getOrDefault("city", ""),
                                billingAddr.getOrDefault("state", ""),
                                billingAddr.getOrDefault("zipCode", ""));
                        }
                        
                        jdbc.update("INSERT INTO payment_methods (user_id, provider, provider_token, brand, last4, exp_month, exp_year, billing_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                            userId, 
                            "dev", // provider
                            "tok_" + card.get("cardType") + "_" + ((String)card.get("cardNumber")).substring(Math.max(0, ((String)card.get("cardNumber")).length() - 4)), // token
                            (String) card.get("cardType"),
                            ((String)card.get("cardNumber")).substring(Math.max(0, ((String)card.get("cardNumber")).length() - 4)), // last 4 digits
                            card.get("expirationMonth"),
                            card.get("expirationYear"),
                            billingAddressJson);
                    }
                }
            }

            // Generate and send email verification code
            String verificationCode = generateVerificationCode();
            LocalDateTime expiresAt = LocalDateTime.now().plusHours(24);
            
            jdbc.update("INSERT INTO verification_codes (user_id, code, expires_at) VALUES (?, ?, ?)",
                userId, verificationCode, expiresAt);

            // In a real application, send email here
            // For now, just log it (in production, use proper email service)
            System.out.println("Verification code for " + email + ": " + verificationCode);

            resp.put("ok", true);
            resp.put("message", "Registration successful! Please check your email for verification code.");
            resp.put("verification_required", true);
            return resp;
        } catch (Exception e) {
            e.printStackTrace();
            resp.put("ok", false);
            resp.put("message", "Registration failed: " + e.getMessage());
            return resp;
        }
    }

    private String generateVerificationCode() {
        Random random = new Random();
        return String.format("%06d", random.nextInt(1000000));
    }

    @PostMapping("/verify-email")
    public Map<String, Object> verifyEmail(@RequestBody Map<String, Object> payload) {
        Map<String, Object> resp = new HashMap<>();
        try {
            String email = (String) payload.get("email");
            String code = (String) payload.get("code");

            if (email == null || email.isBlank() || code == null || code.isBlank()) {
                resp.put("ok", false);
                resp.put("message", "Email and verification code are required");
                return resp;
            }

            // Find user and check verification code
            List<Map<String, Object>> results = jdbc.queryForList(
                "SELECT vc.id, vc.user_id, vc.expires_at, vc.used_at FROM verification_codes vc " +
                "JOIN users u ON vc.user_id = u.id " +
                "WHERE u.email = ? AND vc.code = ? ORDER BY vc.sent_at DESC LIMIT 1",
                email, code);

            if (results.isEmpty()) {
                resp.put("ok", false);
                resp.put("message", "Invalid verification code");
                return resp;
            }

            Map<String, Object> verification = results.get(0);
            LocalDateTime expiresAt = ((Timestamp) verification.get("expires_at")).toLocalDateTime();
            Object usedAt = verification.get("used_at");

            if (usedAt != null) {
                resp.put("ok", false);
                resp.put("message", "Verification code already used");
                return resp;
            }

            if (LocalDateTime.now().isAfter(expiresAt)) {
                resp.put("ok", false);
                resp.put("message", "Verification code expired");
                return resp;
            }

            Long userId = (Long) verification.get("user_id");

            // Mark code as used and activate user account
            jdbc.update("UPDATE verification_codes SET used_at = ? WHERE id = ?", 
                new Timestamp(System.currentTimeMillis()), verification.get("id"));
            
            jdbc.update("UPDATE users SET email_verified_at = ? WHERE id = ?", 
                new Timestamp(System.currentTimeMillis()), userId);

            resp.put("ok", true);
            resp.put("message", "Email verified successfully! Your account is now active.");
            return resp;

        } catch (Exception e) {
            e.printStackTrace();
            resp.put("ok", false);
            resp.put("message", "Email verification failed: " + e.getMessage());
            return resp;
        }
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, Object> payload) {
        String email = (String) payload.get("email");
        String password = (String) payload.get("password");

        Map<String, Object> resp = new HashMap<>();
        if (email == null || password == null) {
            resp.put("ok", false);
            resp.put("message", "email and password required");
            return resp;
        }

        // Fetch stored hash
        try {
            Map<String, Object> row = jdbc.queryForMap("SELECT id, password_hash, first_name, last_name, email FROM users WHERE email = ?", email);
            byte[] stored = (byte[]) row.get("password_hash");
            String storedHash = new String(stored, java.nio.charset.StandardCharsets.UTF_8);
            if (passwordEncoder.matches(password, storedHash)) {
        resp.put("ok", true);
        Map<String, Object> user = new HashMap<>();
        user.put("id", row.get("id"));
        user.put("email", row.get("email"));
        user.put("first_name", row.get("first_name"));
        user.put("last_name", row.get("last_name"));
        resp.put("user", user);
                return resp;
            } else {
                resp.put("ok", false);
                resp.put("message", "Invalid credentials");
                return resp;
            }
        } catch (Exception e) {
            e.printStackTrace();
            resp.put("ok", false);
            resp.put("message", "Authentication error: " + e.getMessage());
            return resp;
        }
    }

    @PutMapping("/profile")
    public Map<String, Object> updateProfile(@RequestBody Map<String, Object> payload) {
        Map<String, Object> resp = new HashMap<>();
        try {
            // identify user by id or email
            Object idObj = payload.get("id");
            String email = (String) payload.get("email");

            if (idObj == null && (email == null || email.isBlank())) {
                resp.put("ok", false);
                resp.put("message", "id or email required");
                return resp;
            }

            List<Object> params = new ArrayList<>();
            StringBuilder setClause = new StringBuilder();

            // first_name may be provided as 'name' or 'first_name'
            if (payload.containsKey("name") || payload.containsKey("first_name")) {
                String first = payload.containsKey("first_name") ? (String) payload.get("first_name") : (String) payload.get("name");
                setClause.append("first_name = ?");
                params.add(first);
            }
            if (payload.containsKey("last_name")) {
                if (setClause.length() > 0) setClause.append(", ");
                setClause.append("last_name = ?");
                params.add((String) payload.get("last_name"));
            }
            if (payload.containsKey("phone")) {
                if (setClause.length() > 0) setClause.append(", ");
                setClause.append("phone = ?");
                params.add((String) payload.get("phone"));
            }

            // password change
            if (payload.containsKey("password") && payload.get("password") != null) {
                String pw = (String) payload.get("password");
                if (pw != null && !pw.isBlank()) {
                    if (setClause.length() > 0) setClause.append(", ");
                    String hashed = passwordEncoder.encode(pw);
                    byte[] hash = hashed.getBytes(java.nio.charset.StandardCharsets.UTF_8);
                    setClause.append("password_hash = ?");
                    params.add(hash);
                }
            }

            if (setClause.length() == 0) {
                resp.put("ok", false);
                resp.put("message", "nothing to update");
                return resp;
            }

            String where = "";
            if (idObj != null) {
                where = " WHERE id = ?";
                params.add(idObj);
            } else {
                where = " WHERE email = ?";
                params.add(email);
            }

            String sql = "UPDATE users SET " + setClause.toString() + where;
            int updated = jdbc.update(sql, params.toArray());

            if (updated == 0) {
                resp.put("ok", false);
                resp.put("message", "No user updated (user not found)");
                return resp;
            }

            // return updated user (use queryForList to avoid exceptions if missing)
            Map<String, Object> row = null;
            if (idObj != null) {
                List<Map<String, Object>> rows = jdbc.queryForList("SELECT id, email, first_name, last_name, phone FROM users WHERE id = ?", idObj);
                if (!rows.isEmpty()) row = rows.get(0);
            } else {
                List<Map<String, Object>> rows = jdbc.queryForList("SELECT id, email, first_name, last_name, phone FROM users WHERE email = ?", email);
                if (!rows.isEmpty()) row = rows.get(0);
            }

            if (row == null) {
                resp.put("ok", false);
                resp.put("message", "Unable to fetch updated user");
                return resp;
            }

            Map<String, Object> user = new HashMap<>();
            user.put("id", row.get("id"));
            user.put("email", row.get("email"));
            user.put("first_name", row.get("first_name"));
            user.put("last_name", row.get("last_name"));
            user.put("phone", row.get("phone"));

            resp.put("ok", true);
            resp.put("user", user);
            return resp;
        } catch (Exception e) {
            e.printStackTrace();
            resp.put("ok", false);
            resp.put("message", "Update failed: " + e.getMessage());
            return resp;
        }
    }

    // Support POST as well to be tolerant of clients that send POST instead of PUT
    @PostMapping("/profile")
    public Map<String, Object> updateProfilePost(@RequestBody Map<String, Object> payload) {
        return updateProfile(payload);
    }
}
