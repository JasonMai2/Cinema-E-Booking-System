package com.cinemae.booking.gateway;

import com.cinemae.booking.dto.PaymentRequest;
import com.cinemae.booking.dto.PaymentResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

/**
 * Fake Payment Gateway Proxy for development and testing environments.
 * This implementation does NOT charge actual cards and simulates successful payments.
 * It follows the Proxy pattern to provide a stand-in for the real payment gateway.
 */
@Service
@Profile({"dev", "test"})
public class FakePaymentGatewayProxy implements PaymentGateway {

    private static final Logger log = LoggerFactory.getLogger(FakePaymentGatewayProxy.class);

    @Override
    public PaymentResult charge(PaymentRequest request) {
        // Do NOT actually charge the card
        log.info("FAKE CHARGE: booking={}, amount={}", request.bookingId(), request.amount());
        
        // Log card info for debugging (in real system, NEVER log sensitive data)
        if (request.cardInfo() != null) {
            log.info("FAKE CHARGE: Card ending in {}", 
                request.cardInfo().getCardNumber() != null && request.cardInfo().getCardNumber().length() >= 4
                    ? request.cardInfo().getCardNumber().substring(request.cardInfo().getCardNumber().length() - 4)
                    : "****");
        }
        
        // Simulate success response
        String fakeTransactionId = "FAKE-TX-" + request.bookingId();
        log.info("FAKE CHARGE SUCCESS: transactionId={}", fakeTransactionId);
        
        return PaymentResult.success(fakeTransactionId);
    }
}
