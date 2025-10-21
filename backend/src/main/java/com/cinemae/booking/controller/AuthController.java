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
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;
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

            // Check existing email
            Integer exists = jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE email = ?", new Object[]{email}, Integer.class);
            if (exists != null && exists > 0) {
                resp.put("ok", false);
                resp.put("message", "Email already registered");
                return resp;
            }

            // store the bcrypt hash as UTF-8 bytes into varbinary column
            String hashed = passwordEncoder.encode(password);
            byte[] hash = hashed.getBytes(java.nio.charset.StandardCharsets.UTF_8);

        jdbc.update("INSERT INTO users (email, password_hash, first_name, last_name, phone, created_at, updated_at) VALUES (?,?,?,?,?,?,?)",
            email, hash, storeFirst, lastName, phone, new Timestamp(System.currentTimeMillis()), new Timestamp(System.currentTimeMillis()));

            resp.put("ok", true);
            resp.put("message", "Registered");
            return resp;
        } catch (Exception e) {
            e.printStackTrace();
            resp.put("ok", false);
            resp.put("message", "Registration failed: " + e.getMessage());
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
