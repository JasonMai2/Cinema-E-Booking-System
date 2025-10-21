package com.cinemae.booking.controller;

import com.cinemae.booking.model.Address;
import com.cinemae.booking.model.PaymentCard;
import com.cinemae.booking.model.User;
import com.cinemae.booking.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getProfile(@RequestParam Long userId) {
        User user = userService.getUserProfile(userId);
        Map<String, Object> profile = new HashMap<>();
        profile.put("firstName", user.getFirstName());
        profile.put("lastName", user.getLastName());
        profile.put("email", user.getEmail());
        profile.put("phone", user.getPhone());

        Address billing = user.getAddresses().stream()
                .filter(a -> a.getType() == Address.AddressType.HOME)
                .findFirst().orElse(null);
        if (billing != null) {
            Map<String, Object> address = new HashMap<>();
            address.put("street", billing.getStreet());
            address.put("city", billing.getCity());
            address.put("state", billing.getState());
            address.put("postalCode", billing.getPostalCode());
            profile.put("billingAddress", address);
        }

        PaymentCard card = user.getPaymentCards().stream()
                .filter(pc -> pc.getIsDefault())
                .findFirst().orElse(null);
        if (card != null) {
            Map<String, Object> payment = new HashMap<>();
            payment.put("brand", card.getBrand());
            payment.put("last4", card.getLast4());
            payment.put("expMonth", card.getExpMonth());
            payment.put("expYear", card.getExpYear());
            profile.put("paymentCard", payment);
        }

        Boolean promotions = user.getPromotionSubscription() != null ? user.getPromotionSubscription().getSubscribed()
                : true;
        profile.put("promotions", promotions);

        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(@RequestParam Long userId,
            @RequestBody Map<String, Object> updates) {
        String firstName = (String) updates.get("firstName");
        String lastName = (String) updates.get("lastName");
        String phone = (String) updates.get("phone");

        Address billingAddress = null;
        if (updates.containsKey("billingAddress")) {
            Object addrObj = updates.get("billingAddress");
            if (addrObj instanceof Map) {
                Map<?, ?> addr = (Map<?, ?>) addrObj;
                billingAddress = new Address();
                billingAddress.setStreet((String) addr.get("street"));
                billingAddress.setCity((String) addr.get("city"));
                billingAddress.setState((String) addr.get("state"));
                billingAddress.setPostalCode((String) addr.get("postalCode"));
            }
        }

        PaymentCard paymentCard = null;
        if (updates.containsKey("paymentCard")) {
            Object cardObj = updates.get("paymentCard");
            if (cardObj instanceof Map) {
                Map<?, ?> card = (Map<?, ?>) cardObj;
                paymentCard = new PaymentCard();
                paymentCard.setBrand((String) card.get("brand"));
                paymentCard.setLast4((String) card.get("last4"));
                Object expMonthObj = card.get("expMonth");
                if (expMonthObj != null) {
                    Byte parsedExpMonth = null;
                    if (expMonthObj instanceof Number) {
                        parsedExpMonth = ((Number) expMonthObj).byteValue();
                    } else if (expMonthObj instanceof String) {
                        try {
                            parsedExpMonth = Byte.parseByte(((String) expMonthObj).trim());
                        } catch (NumberFormatException e) {
                            Map<String, Object> response = new HashMap<>();
                            response.put("message", "Invalid paymentCard.expMonth");
                            return ResponseEntity.badRequest().body(response);
                        }
                    } else {
                        Map<String, Object> response = new HashMap<>();
                        response.put("message", "Invalid paymentCard.expMonth");
                        return ResponseEntity.badRequest().body(response);
                    }
                    if (parsedExpMonth != null) {
                        if (parsedExpMonth < 1 || parsedExpMonth > 12) {
                            Map<String, Object> response = new HashMap<>();
                            response.put("message", "Invalid paymentCard.expMonth: must be 1..12");
                            return ResponseEntity.badRequest().body(response);
                        }
                        paymentCard.setExpMonth(parsedExpMonth);
                    }
                }
                Object expYearObj = card.get("expYear");
                if (expYearObj != null) {
                    Short parsedExpYear = null;
                    if (expYearObj instanceof Number) {
                        parsedExpYear = ((Number) expYearObj).shortValue();
                    } else if (expYearObj instanceof String) {
                        try {
                            parsedExpYear = Short.parseShort(((String) expYearObj).trim());
                        } catch (NumberFormatException e) {
                            Map<String, Object> response = new HashMap<>();
                            response.put("message", "Invalid paymentCard.expYear");
                            return ResponseEntity.badRequest().body(response);
                        }
                    } else {
                        Map<String, Object> response = new HashMap<>();
                        response.put("message", "Invalid paymentCard.expYear");
                        return ResponseEntity.badRequest().body(response);
                    }
                    if (parsedExpYear != null) {
                        if (parsedExpYear < 0) {
                            Map<String, Object> response = new HashMap<>();
                            response.put("message", "Invalid paymentCard.expYear");
                            return ResponseEntity.badRequest().body(response);
                        }
                        paymentCard.setExpYear(parsedExpYear);
                    }
                }
                paymentCard.setProcessorToken((String) card.get("processorToken"));
            }
        }

        Boolean promotions = (Boolean) updates.get("promotions");

        userService.updateProfile(userId, firstName, lastName, phone, billingAddress, paymentCard, promotions);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Profile updated successfully");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(@RequestParam Long userId,
            @RequestBody Map<String, String> passwords) {
        String currentPassword = passwords.get("currentPassword");
        String newPassword = passwords.get("newPassword");

        userService.changePassword(userId, currentPassword, newPassword);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Password changed successfully");
        return ResponseEntity.ok(response);
    }
}