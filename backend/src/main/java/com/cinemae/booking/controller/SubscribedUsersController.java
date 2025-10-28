package com.cinemae.booking.controller;

import com.cinemae.booking.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
public class SubscribedUsersController {

    private final JdbcTemplate jdbc;
    private final EmailService emailService;

    @Autowired
    public SubscribedUsersController(JdbcTemplate jdbc, EmailService emailService) {
        this.jdbc = jdbc;
        this.emailService = emailService;
    }

    @GetMapping("/subscribed-users")
    public List<Map<String, Object>> getSubscribedUsers() {
        String sql = """
            SELECT u.id, u.first_name, u.last_name, u.email, ps.updated_at
            FROM users u
            JOIN promotion_subscriptions ps ON u.id = ps.user_id
            WHERE ps.subscribed = 1
        """;

        return jdbc.queryForList(sql);
    }

    // --- Send promotion email to all subscribed users ---
    @PostMapping("/send-promotion/{promotionId}")
    public Map<String, Object> sendPromotionEmails(@PathVariable Long promotionId) {
        Map<String, Object> response = new HashMap<>();

        try {
            // 1️⃣ Get all subscribed users
            String userSql = "SELECT u.email, u.first_name FROM users u " +
                             "JOIN promotion_subscriptions ps ON u.id = ps.user_id " +
                             "WHERE ps.subscribed = 1";
            List<Map<String, Object>> users = jdbc.queryForList(userSql);

            if (users.isEmpty()) {
                response.put("status", "no_subscribers");
                response.put("message", "No subscribed users found.");
                return response;
            }

            // 2️⃣ Get promotion details
            String promoSql = "SELECT name, description, percent_off, flat_off_cents, starts_at, ends_at " +
                              "FROM promotions WHERE id = ?";
            Map<String, Object> promo = jdbc.queryForMap(promoSql, promotionId);

            String promoTitle = (String) promo.get("name");
            String promoDesc = promo.get("description") != null ? (String) promo.get("description") : "";
            Double percentOff = promo.get("percent_off") != null ? ((Number) promo.get("percent_off")).doubleValue() : null;
            Integer flatOffCents = promo.get("flat_off_cents") != null ? ((Number) promo.get("flat_off_cents")).intValue() : null;
            String startsAt = promo.get("starts_at").toString();
            String endsAt = promo.get("ends_at").toString();

            String discountText = percentOff != null ? String.format("%.0f%% off", percentOff) :
                                  flatOffCents != null ? String.format("$%.2f off", flatOffCents / 100.0) :
                                  "a special discount";

            // 3️⃣ Send emails using EmailService
            int sentCount = 0;
            for (Map<String, Object> user : users) {
                String email = (String) user.get("email");
                String firstName = user.get("first_name") != null ? (String) user.get("first_name") : "Valued Customer";

                emailService.sendPromotionEmail(email, firstName, promoTitle, promoDesc, discountText, startsAt, endsAt);
                sentCount++;
            }

            response.put("status", "success");
            response.put("sentCount", sentCount);
            response.put("message", "Promotion emails sent successfully.");
        } catch (Exception e) {
            e.printStackTrace();
            response.put("status", "error");
            response.put("message", e.getMessage());
        }

        return response;
    }
}