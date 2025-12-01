package com.cinemae.booking.gateway;

import com.cinemae.booking.dto.PaymentRequest;
import com.cinemae.booking.dto.PaymentResult;

/**
 * Payment Gateway interface for processing payments.
 * This interface allows different implementations (real or fake) to be used
 * based on the application profile (prod, dev, test).
 */
public interface PaymentGateway {
    /**
     * Process a payment charge for a booking.
     * 
     * @param request The payment request containing booking ID, amount, and card info
     * @return PaymentResult indicating success or failure with transaction ID or error message
     */
    PaymentResult charge(PaymentRequest request);
}
