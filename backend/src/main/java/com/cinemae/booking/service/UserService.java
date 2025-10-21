package com.cinemae.booking.service;

import com.cinemae.booking.model.Address;
import com.cinemae.booking.model.PaymentCard;
import com.cinemae.booking.model.PromotionSubscription;
import com.cinemae.booking.model.User;
import com.cinemae.booking.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Optional<User> findByEmail(String email) {
        if (email == null || email.isBlank()) {
            return Optional.empty();
        }
        return userRepository.findByEmail(email);
    }

    @Transactional(readOnly = true)
    public User getUserProfile(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("userId must not be null");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getAddresses() == null) {
            user.setAddresses(Collections.emptyList());
        }
        if (user.getPaymentCards() == null) {
            user.setPaymentCards(Collections.emptyList());
        }

        user.getAddresses().size();
        user.getPaymentCards().size();

        return user;
    }

    @Transactional
    public User updateProfile(Long userId, String firstName, String lastName, String phone,
            Address billingAddress, PaymentCard paymentCard, Boolean promotions) {
        if (userId == null) {
            throw new IllegalArgumentException("userId must not be null");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (firstName != null) {
            user.setFirstName(firstName);
        }
        if (lastName != null) {
            user.setLastName(lastName);
        }
        if (phone != null) {
            user.setPhone(phone);
        }

        List<Address> addresses = user.getAddresses() == null ? new java.util.ArrayList<>()
                : new java.util.ArrayList<>(user.getAddresses());

        if (billingAddress != null) {
            Address existing = addresses.stream()
                    .filter(a -> a.getType() == Address.AddressType.HOME)
                    .findFirst().orElse(null);
            if (existing != null) {
                if (billingAddress.getStreet() != null) {
                    existing.setStreet(billingAddress.getStreet());
                }
                if (billingAddress.getCity() != null) {
                    existing.setCity(billingAddress.getCity());
                }
                if (billingAddress.getState() != null) {
                    existing.setState(billingAddress.getState());
                }
                if (billingAddress.getPostalCode() != null) {
                    existing.setPostalCode(billingAddress.getPostalCode());
                }
            } else {
                billingAddress.setUser(user);
                billingAddress.setType(Address.AddressType.HOME);
                addresses.add(billingAddress);
            }
            user.setAddresses(addresses);
        }

        List<PaymentCard> paymentCards = user.getPaymentCards() == null ? new java.util.ArrayList<>()
                : new java.util.ArrayList<>(user.getPaymentCards());

        if (paymentCard != null) {
            PaymentCard existing = paymentCards.stream()
                    .filter(pc -> Boolean.TRUE.equals(pc.getIsDefault()))
                    .findFirst().orElse(null);
            if (existing != null) {
                if (paymentCard.getBrand() != null) {
                    existing.setBrand(paymentCard.getBrand());
                }
                if (paymentCard.getLast4() != null) {
                    existing.setLast4(paymentCard.getLast4());
                }
                if (paymentCard.getExpMonth() != null) {
                    existing.setExpMonth(paymentCard.getExpMonth());
                }
                if (paymentCard.getExpYear() != null) {
                    existing.setExpYear(paymentCard.getExpYear());
                }
                if (paymentCard.getProcessorToken() != null) {
                    existing.setProcessorToken(paymentCard.getProcessorToken());
                }
            } else {
                paymentCard.setUser(user);
                paymentCard.setIsDefault(true);
                paymentCards.add(paymentCard);
            }
            user.setPaymentCards(paymentCards);
        }

        if (promotions != null) {
            PromotionSubscription sub = user.getPromotionSubscription();
            if (sub == null) {
                sub = new PromotionSubscription();
                sub.setUser(user);
                user.setPromotionSubscription(sub);
            }
            sub.setSubscribed(promotions);
        }

        return userRepository.save(user);
    }

    @Transactional
    public void changePassword(Long userId, String currentPassword, String newPassword) {
        if (userId == null) {
            throw new IllegalArgumentException("userId must not be null");
        }
        if (currentPassword == null || newPassword == null) {
            throw new IllegalArgumentException("passwords must not be null");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        byte[] stored = user.getPasswordHash();
        String storedHash = stored == null ? "" : new String(stored, StandardCharsets.UTF_8);

        if (!passwordEncoder.matches(currentPassword, storedHash)) {
            throw new RuntimeException("Current password is incorrect");
        }

        byte[] newHash = passwordEncoder.encode(newPassword).getBytes(StandardCharsets.UTF_8);
        user.setPasswordHash(newHash);
        userRepository.save(user);
    }
}