package com.cinemae.booking.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender emailSender;

    @Value("${app.email.from}")
    private String fromEmail;

    @Value("${app.email.verification.subject}")
    private String verificationSubject;

    @Value("${app.email.password-reset.subject}")
    private String passwordResetSubject;

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
}