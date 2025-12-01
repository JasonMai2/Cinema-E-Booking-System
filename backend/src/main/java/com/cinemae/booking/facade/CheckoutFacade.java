package com.cinemae.booking.facade;

import com.cinemae.booking.dto.CheckoutRequest;
import com.cinemae.booking.dto.CheckoutResult;
import com.cinemae.booking.dto.PaymentRequest;
import com.cinemae.booking.dto.PaymentResult;
import com.cinemae.booking.gateway.PaymentGateway;
import com.cinemae.booking.model.Booking;
import com.cinemae.booking.model.Ticket;
import com.cinemae.booking.service.BookingService;
import com.cinemae.booking.service.EmailService;
import com.cinemae.booking.service.PromotionService;
import com.cinemae.booking.service.TicketService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Application-layer Facade for the checkout workflow.
 * This facade orchestrates the entire checkout process by coordinating multiple services:
 * 1. Promotion validation (PromotionService - if promo code provided)
 * 2. Booking creation and seat reservation (BookingService)
 * 3. Payment processing (PaymentGateway - real or fake based on profile)
 * 4. Ticket generation (TicketService)
 * 5. Confirmation email (EmailService)
 * 
 * This implements the Facade pattern to provide a simplified interface to the complex
 * checkout subsystem.
 */
@Service
public class CheckoutFacade {

    private static final Logger log = LoggerFactory.getLogger(CheckoutFacade.class);

    private final BookingService bookingService;
    private final PaymentGateway paymentGateway; // Interface - implementation injected based on profile
    private final TicketService ticketService;
    private final EmailService emailService;
    private final PromotionService promotionService;

    /**
     * Constructor with dependency injection.
     * The PaymentGateway implementation (Real or Fake) is automatically injected
     * based on the active Spring profile (prod, dev, test).
     */
    public CheckoutFacade(BookingService bookingService,
                          PaymentGateway paymentGateway,
                          TicketService ticketService,
                          EmailService emailService,
                          PromotionService promotionService) {
        this.bookingService = bookingService;
        this.paymentGateway = paymentGateway;
        this.ticketService = ticketService;
        this.emailService = emailService;
        this.promotionService = promotionService;
        
        log.info("CheckoutFacade initialized with PaymentGateway: {}", 
                 paymentGateway.getClass().getSimpleName());
    }

    /**
     * Execute the complete checkout workflow.
     * This is the main facade method that coordinates all checkout steps.
     * 
     * @param request The checkout request containing user, showtime, seats, payment info, and optional promo code
     * @return CheckoutResult with booking and tickets if successful, or error message if failed
     */
    public CheckoutResult checkout(CheckoutRequest request) {
        log.info("Starting checkout for user={}, showtime={}, seats={}, promoCode={}", 
                 request.getUserId(), request.getShowtimeId(), request.getSelectedSeats().size(),
                 request.getPromoCode() != null ? "'" + request.getPromoCode() + "'" : "none");

        try {
            // STEP 0: Validate and apply promotion if provided
            Long promoCodeId = null;
            Integer discountCents = 0;
            String promoName = null;
            
            if (request.getPromoCode() != null && !request.getPromoCode().trim().isEmpty()) {
                log.info("Step 0: Validating promotion code");
                try {
                    // First calculate subtotal to determine discount amount
                    // We need to do a preliminary calculation without creating the booking
                    int preliminarySubtotal = calculatePreliminarySubtotal(request);
                    
                    PromotionService.PromotionResult promoResult = 
                        promotionService.validateAndApplyPromotion(request.getPromoCode(), preliminarySubtotal);
                    
                    promoCodeId = promoResult.getCodeId();
                    discountCents = promoResult.getDiscountCents();
                    promoName = promoResult.getName();
                    
                    log.info("Promotion '{}' applied: {} cents discount", promoName, discountCents);
                } catch (IllegalArgumentException e) {
                    // Promotion validation failed - return user-friendly error
                    log.error("Promotion validation failed: {}", e.getMessage());
                    return CheckoutResult.failure(e.getMessage());
                }
            }

            // STEP 1: Reserve seats and calculate total (with discount if applicable)
            log.info("Step 1: Creating booking and reserving seats");
            Booking booking = bookingService.createBooking(
                    request.getUserId(),
                    request.getShowtimeId(),
                    request.getSelectedSeats(),
                    promoCodeId,
                    discountCents
            );
            log.info("Booking created: id={}, total={} cents", booking.getId(), booking.getTotalPrice());

            // STEP 2: Process payment (real or fake based on active gateway)
            log.info("Step 2: Processing payment through {}", paymentGateway.getClass().getSimpleName());
            PaymentResult paymentResult = paymentGateway.charge(
                    new PaymentRequest(
                            booking.getId(),
                            booking.getTotalPrice(),
                            request.getCardInfo()
                    )
            );

            // Check payment result
            if (!paymentResult.isSuccess()) {
                log.error("Payment failed for booking {}: {}", booking.getId(), paymentResult.getErrorMessage());
                bookingService.markAsFailed(booking.getId());
                return CheckoutResult.failure(paymentResult.getErrorMessage());
            }

            log.info("Payment successful: transactionId={}", paymentResult.getTransactionId());

            // STEP 3: Confirm booking and create tickets
            log.info("Step 3: Confirming booking and generating tickets");
            bookingService.markAsPaid(booking.getId());
            
            // Increment promotion redemption count if promotion was used
            if (promoCodeId != null) {
                promotionService.incrementRedemptionCount(promoCodeId);
                log.info("Incremented redemption count for promo code ID: {}", promoCodeId);
            }
            
            List<Ticket> tickets = ticketService.generateTickets(
                    booking, 
                    request.getShowtimeId(), 
                    request.getSelectedSeats()
            );
            log.info("Generated {} tickets for booking {}", tickets.size(), booking.getId());

            // STEP 4: Send confirmation email
            log.info("Step 4: Sending confirmation email");
            emailService.sendBookingConfirmation(
                    request.getUserId(), 
                    booking, 
                    tickets
            );

            log.info("Checkout completed successfully for booking {}", booking.getId());
            
            // Return success with promotion info if applicable
            if (promoName != null) {
                return CheckoutResult.successWithPromotion(booking, tickets, promoName);
            } else {
                return CheckoutResult.success(booking, tickets);
            }

        } catch (Exception e) {
            log.error("Checkout failed with exception", e);
            return CheckoutResult.failure("Checkout failed: " + e.getMessage());
        }
    }

    /**
     * Calculate preliminary subtotal for promotion validation.
     * This duplicates some logic from BookingService but avoids creating a booking
     * before validating the promotion code.
     */
    private int calculatePreliminarySubtotal(CheckoutRequest request) {
        // This is a simplified calculation - in a real system you might want to
        // extract this logic to a shared service or have BookingService expose it
        int count = request.getSelectedSeats().size();
        // Using a rough estimate - adult price ($12) per seat
        // The actual BookingService will do the precise calculation
        return count * 1200;
    }
}
