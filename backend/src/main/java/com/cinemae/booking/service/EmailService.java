package com.cinemae.booking.service;

import com.cinemae.booking.model.Booking;
import com.cinemae.booking.model.Ticket;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender emailSender;

    @Autowired
    private JdbcTemplate jdbc;

    @Value("${app.email.from}")
    private String fromEmail;

    @Value("${app.email.verification.subject}")
    private String verificationSubject;

    @Value("${app.email.password-reset.subject}")
    private String passwordResetSubject;

    @Value("${app.email.promotion.subject}")
    private String promotionSubject;

    public void sendVerificationEmail(String toEmail, String verificationCode) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(verificationSubject);
            message.setText(buildVerificationEmailBody(verificationCode));
            
            emailSender.send(message);
            System.out.println("✅ Verification email sent successfully to: " + toEmail);
            System.out.println("📧 Verification code: " + verificationCode);
        } catch (Exception e) {
            System.err.println("❌ Failed to send verification email to " + toEmail + ": " + e.getMessage());
            e.printStackTrace();
            // Fallback: log the code to console so testing can continue
            System.out.println("🔧 FALLBACK - Verification code for testing: " + verificationCode);
        }
    }

    private String buildVerificationEmailBody(String verificationCode) {
        return String.format("""
            Welcome to Cinema E-Booking System!
            
            Thank you for creating an account with us. To complete your registration, please verify your email address using the verification code below:
            
            Verification Code: %s
            
            Instructions:
            1. Go to the email verification page on our website
            2. Enter this 6-digit verification code
            3. Your account will be activated and ready to use
            
            This verification code will expire in 24 hours for security reasons.
            
            If you didn't create an account with Cinema E-Booking System, please ignore this email.
            
            Thank you,
            Cinema E-Booking System Team
            
            ---
            This is an automated message, please do not reply to this email.
            """, verificationCode);
    }

    public void sendPasswordResetEmail(String toEmail, String resetCode) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(passwordResetSubject);
            message.setText(buildPasswordResetEmailBody(resetCode));
            
            emailSender.send(message);
            System.out.println("🔐 Password reset email sent successfully to: " + toEmail);
            System.out.println("🔑 Reset code: " + resetCode);
        } catch (Exception e) {
            System.err.println("❌ Failed to send password reset email to " + toEmail + ": " + e.getMessage());
            e.printStackTrace();
            // Fallback: log the code to console so testing can continue
            System.out.println("🔧 FALLBACK - Reset code for testing: " + resetCode);
        }
    }

    public void sendWelcomeEmail(String toEmail, String firstName) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Welcome to Cinema E-Booking System!");
            message.setText(buildWelcomeEmailBody(firstName));
            
            emailSender.send(message);
            System.out.println("🎉 Welcome email sent successfully to: " + toEmail);
        } catch (Exception e) {
            System.err.println("❌ Failed to send welcome email to " + toEmail + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void sendPromotionEmail(String toEmail, String firstName, String title, String description,
                               String discountText, String startsAt, String endsAt) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(title);
            message.setText(String.format("""
                    Hi %s,

                    %s

                    Enjoy %s on your next order.
                    Valid from %s to %s.

                    – Cinema E-Booking Team
                    """, firstName != null ? firstName : "Valued Customer",
                        description, discountText, startsAt, endsAt));

            emailSender.send(message);
            System.out.println("✅ Promotion email sent to: " + toEmail);
        } catch (Exception e) {
            System.err.println("❌ Failed to send promotion email to " + toEmail + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    private String buildPasswordResetEmailBody(String resetCode) {
        return String.format("""
            Dear Cinema E-Booking System User,
            
            We received a request to reset your password. If you made this request, please use the following 6-digit code to reset your password:
            
            Your password reset code: %s
            
            Instructions:
            1. Go to the password reset page on our website
            2. Enter this 6-digit reset code
            3. Create your new password
            4. Confirm your new password
            
            This reset code will expire in 1 hour for security reasons.
            
            If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
            
            For security reasons, never share this reset code with anyone.
            
            Best regards,
            Cinema E-Booking System Team
            
            ---
            This is an automated message, please do not reply to this email.
            """, resetCode);
    }

    private String buildWelcomeEmailBody(String firstName) {
        return String.format("""
            Hi %s,
            
            Welcome to Cinema E-Booking System! 🎬
            
            Your email has been successfully verified and your account is now active. You can now:
            
            • Browse our latest movie selections
            • Book tickets for your favorite shows
            • Manage your bookings and profile
            • Enjoy exclusive member benefits
            
            Thank you for joining our community of movie lovers!
            
            Start exploring: [Your Website URL Here]
            
            Best regards,
            Cinema E-Booking System Team
            
            ---
            Need help? Contact our support team or visit our FAQ section.
            """, firstName != null ? firstName : "Movie Lover");
    }

    private String buildPromotionEmailBody(String firstName, String promoTitle, String promoDesc,
                                           String discountText, String startsAt, String endsAt) {
        return String.format("""
            Hi %s,
            
            🎬 %s
            
            %s
            
            Enjoy %s your next booking at Cinema E-Booking!
            
            📅 Valid from: %s
            ⏰ Until: %s
            
            Don't miss out on this exclusive offer—book your next movie today!
            
            – Cinema E-Booking Team
            
            ---
            This is an automated message. Please do not reply.
            """,
            firstName != null ? firstName : "Valued Customer",
            promoTitle,
            promoDesc != null ? promoDesc : "",
            discountText,
            startsAt,
            endsAt
        );
    }
    
    public void sendProfileChangeNotification(String toEmail, String firstName) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Profile Updated - Cinema E-Booking System");
            message.setText(buildProfileChangeEmailBody(firstName));
            
            emailSender.send(message);
            System.out.println("✅ Profile change notification sent successfully to: " + toEmail);
        } catch (Exception e) {
            System.err.println("❌ Failed to send profile change notification to " + toEmail + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    private String buildProfileChangeEmailBody(String firstName) {
        return String.format("""
            Hi %s,
            
            Your profile information has been successfully updated on Cinema E-Booking System.
            
            If you made these changes, no further action is required. Your updated information is now active and will be used for your future bookings and communications.
            
            Profile Update Details:
            • Date: %s
            • Changes: Your profile information has been modified
            
            Security Notice:
            If you did NOT make these changes to your profile, please take immediate action:
            1. Reset your password immediately
            2. Review your account activity
            3. Contact our support team if you notice any suspicious activity
            
            Your account security is our top priority. We recommend:
            • Using a strong, unique password
            • Regularly reviewing your account settings
            
            Thank you for keeping your account information up to date!
            
            Best regards,
            Cinema E-Booking System Team
            
            ---
            This is an automated security notification. Please do not reply to this email.
            If you need assistance, please contact our support team.
            """, 
            firstName != null ? firstName : "Valued Customer",
            java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("MMMM dd, yyyy 'at' hh:mm a"))
        );
    }

    /**
     * Send booking confirmation email with ticket details.
     * 
     * @param userId User ID to get email and name
     * @param booking The confirmed booking
     * @param tickets List of tickets for this booking
     */
    public void sendBookingConfirmation(Long userId, Booking booking, List<Ticket> tickets) {
        try {
            // Get user email and name
            Map<String, Object> user = jdbc.queryForMap(
                "SELECT email, first_name, last_name FROM users WHERE id = ?", userId
            );
            
            String toEmail = (String) user.get("email");
            String firstName = (String) user.get("first_name");
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Booking Confirmation - Cinema E-Booking System");
            message.setText(buildBookingConfirmationBody(firstName, booking, tickets));
            
            emailSender.send(message);
            System.out.println("🎫 Booking confirmation email sent successfully to: " + toEmail);
            System.out.println("📋 Booking Number: " + booking.getBookingNumber());
        } catch (Exception e) {
            System.err.println("❌ Failed to send booking confirmation email: " + e.getMessage());
            e.printStackTrace();
            // Don't throw exception - email failure shouldn't fail the booking
        }
    }

    private String buildBookingConfirmationBody(String firstName, Booking booking, List<Ticket> tickets) {
        StringBuilder body = new StringBuilder();
        
        body.append(String.format("""
            Hi %s,
            
            Thank you for your booking! Your tickets have been confirmed. 🎬
            
            ═══════════════════════════════════════
            BOOKING CONFIRMATION
            ═══════════════════════════════════════
            
            Booking Number: %s
            Status: %s
            
            """, 
            firstName != null ? firstName : "Movie Lover",
            booking.getBookingNumber(),
            booking.getStatus()
        ));

        // Add ticket details
        body.append("YOUR TICKETS:\n");
        body.append("───────────────────────────────────────\n");
        
        for (int i = 0; i < tickets.size(); i++) {
            Ticket ticket = tickets.get(i);
            body.append(String.format("""
                
                Ticket #%d
                Ticket Number: %s
                Movie: %s
                Auditorium: %s
                Seat: %s
                Category: %s
                Price: $%.2f
                Showtime: %s
                """,
                i + 1,
                ticket.getTicketNumber(),
                ticket.getMovieTitle() != null ? ticket.getMovieTitle() : "N/A",
                ticket.getAuditoriumName() != null ? ticket.getAuditoriumName() : "N/A",
                ticket.getSeatLabel() != null ? ticket.getSeatLabel() : "N/A",
                ticket.getAgeCategory(),
                ticket.getPriceCents() / 100.0,
                ticket.getShowtimeStart() != null ? ticket.getShowtimeStart() : "N/A"
            ));
        }

        // Add pricing summary
        body.append(String.format("""
            
            ───────────────────────────────────────
            PAYMENT SUMMARY
            ───────────────────────────────────────
            
            Subtotal:       $%.2f
            Booking Fees:   $%.2f
            Tax:            $%.2f
            ───────────────────────────────────────
            TOTAL PAID:     $%.2f
            
            ═══════════════════════════════════════
            
            IMPORTANT INFORMATION:
            
            • Please arrive at least 15 minutes before showtime
            • Present your ticket number at the entrance
            • You can access your tickets anytime from your account
            • Save this email for your records
            
            Need to make changes or have questions?
            Visit your account dashboard or contact our support team.
            
            Enjoy your movie! 🍿
            
            Best regards,
            Cinema E-Booking System Team
            
            ───────────────────────────────────────
            This is an automated confirmation email.
            For support, please contact us through your account.
            """,
            booking.getSubtotalCents() / 100.0,
            booking.getFeesCents() / 100.0,
            booking.getTaxCents() / 100.0,
            booking.getTotalCents() / 100.0
        ));

        return body.toString();
    }
}