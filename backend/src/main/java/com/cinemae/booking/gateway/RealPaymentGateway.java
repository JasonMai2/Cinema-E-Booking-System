package com.cinemae.booking.gateway;

import com.cinemae.booking.dto.PaymentRequest;
import com.cinemae.booking.dto.PaymentResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

/**
 * Real Payment Gateway implementation for production environment.
 * This is a placeholder that would integrate with a real payment provider (Stripe, PayPal, etc.)
 * Currently returns success for demonstration purposes.
 */
@Service
@Profile("prod")
public class RealPaymentGateway implements PaymentGateway {

    private static final Logger log = LoggerFactory.getLogger(RealPaymentGateway.class);

    @Override
    public PaymentResult charge(PaymentRequest request) {
        // TODO: integrate with real provider (Stripe, PayPal, etc.)
        log.warn("RealPaymentGateway.charge() called but not yet implemented - returning mock success");
        log.info("REAL CHARGE ATTEMPT: booking={}, amount={}", request.bookingId(), request.amount());
        
        // For now this is just a placeholder
        // In production, this would:
        // 1. Create a payment intent with the provider
        // 2. Process the card through the provider's API
        // 3. Handle responses, errors, and edge cases
        // 4. Return appropriate PaymentResult
        
        String transactionId = "REAL-TX-" + request.bookingId();
        return PaymentResult.success(transactionId);
    }
}
