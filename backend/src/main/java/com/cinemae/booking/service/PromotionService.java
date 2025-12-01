package com.cinemae.booking.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Service for managing and validating promotions and promotion codes.
 */
@Service
public class PromotionService {

    private static final Logger log = LoggerFactory.getLogger(PromotionService.class);
    private final JdbcTemplate jdbc;

    @Autowired
    public PromotionService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * Validate and apply a promotion code.
     * Returns the promotion code ID and discount information if valid.
     * Throws exception with user-friendly message if invalid.
     * 
     * @param code The promotion code to validate
     * @param subtotalCents The booking subtotal to apply discount to
     * @return PromotionResult with code ID and discounted amount
     * @throws IllegalArgumentException if code is invalid, inactive, or expired
     */
    public PromotionResult validateAndApplyPromotion(String code, Integer subtotalCents) {
        if (code == null || code.trim().isEmpty()) {
            throw new IllegalArgumentException("Promotion code cannot be empty");
        }

        log.info("Validating promotion code: {}", code);

        try {
            // Get promotion code and associated promotion
            String sql = """
                SELECT pc.id AS code_id, pc.promotion_id, pc.max_redemptions, pc.redeemed_count,
                       p.name, p.description, p.percent_off, p.flat_off_cents, 
                       p.starts_at, p.ends_at, p.active
                FROM promotion_codes pc
                JOIN promotions p ON pc.promotion_id = p.id
                WHERE pc.code = ?
                """;
            
            Map<String, Object> result = jdbc.queryForMap(sql, code);

            Long codeId = ((Number) result.get("code_id")).longValue();
            Long promotionId = ((Number) result.get("promotion_id")).longValue();
            String name = (String) result.get("name");
            Boolean active = (Boolean) result.get("active");
            LocalDateTime startsAt = ((java.sql.Timestamp) result.get("starts_at")).toLocalDateTime();
            LocalDateTime endsAt = ((java.sql.Timestamp) result.get("ends_at")).toLocalDateTime();
            
            Integer maxRedemptions = result.get("max_redemptions") != null 
                ? ((Number) result.get("max_redemptions")).intValue() 
                : null;
            Integer redeemedCount = ((Number) result.get("redeemed_count")).intValue();

            // Check if promotion is active
            if (!active) {
                log.warn("Promotion '{}' is inactive", name);
                throw new IllegalArgumentException(
                    "The promotion '" + name + "' is currently inactive and cannot be applied"
                );
            }

            // Check if promotion has started
            LocalDateTime now = LocalDateTime.now();
            if (now.isBefore(startsAt)) {
                log.warn("Promotion '{}' has not started yet (starts: {})", name, startsAt);
                throw new IllegalArgumentException(
                    "The promotion '" + name + "' has not started yet. It will be available starting " + 
                    startsAt.toLocalDate()
                );
            }

            // Check if promotion has expired
            if (now.isAfter(endsAt)) {
                log.warn("Promotion '{}' has expired (ended: {})", name, endsAt);
                throw new IllegalArgumentException(
                    "The promotion '" + name + "' has expired on " + endsAt.toLocalDate()
                );
            }

            // Check redemption limit
            if (maxRedemptions != null && redeemedCount >= maxRedemptions) {
                log.warn("Promotion code '{}' has reached max redemptions ({}/{})", 
                    code, redeemedCount, maxRedemptions);
                throw new IllegalArgumentException(
                    "This promotion code has reached its maximum number of redemptions"
                );
            }

            // Calculate discount
            Integer discountCents;
            Double percentOff = result.get("percent_off") != null 
                ? ((Number) result.get("percent_off")).doubleValue() 
                : null;
            Integer flatOffCents = result.get("flat_off_cents") != null 
                ? ((Number) result.get("flat_off_cents")).intValue() 
                : null;

            if (percentOff != null) {
                // Percentage discount
                discountCents = (int) Math.round(subtotalCents * (percentOff / 100.0));
                log.info("Applying {}% discount: {} cents off", percentOff, discountCents);
            } else if (flatOffCents != null) {
                // Flat discount
                discountCents = Math.min(flatOffCents, subtotalCents); // Don't discount more than subtotal
                log.info("Applying flat discount: {} cents off", discountCents);
            } else {
                log.warn("Promotion '{}' has no discount configured", name);
                throw new IllegalArgumentException(
                    "The promotion '" + name + "' is not properly configured"
                );
            }

            log.info("Promotion '{}' validated successfully. Discount: {} cents", name, discountCents);
            
            return new PromotionResult(codeId, promotionId, name, discountCents);

        } catch (EmptyResultDataAccessException e) {
            log.warn("Promotion code '{}' not found", code);
            throw new IllegalArgumentException("Invalid promotion code");
        }
    }

    /**
     * Increment the redemption count for a promotion code after successful booking.
     */
    public void incrementRedemptionCount(Long promoCodeId) {
        log.info("Incrementing redemption count for promo code ID: {}", promoCodeId);
        jdbc.update(
            "UPDATE promotion_codes SET redeemed_count = redeemed_count + 1 WHERE id = ?",
            promoCodeId
        );
    }

    /**
     * Result object containing validated promotion information.
     */
    public static class PromotionResult {
        private final Long codeId;
        private final Long promotionId;
        private final String name;
        private final Integer discountCents;

        public PromotionResult(Long codeId, Long promotionId, String name, Integer discountCents) {
            this.codeId = codeId;
            this.promotionId = promotionId;
            this.name = name;
            this.discountCents = discountCents;
        }

        public Long getCodeId() {
            return codeId;
        }

        public Long getPromotionId() {
            return promotionId;
        }

        public String getName() {
            return name;
        }

        public Integer getDiscountCents() {
            return discountCents;
        }
    }
}
