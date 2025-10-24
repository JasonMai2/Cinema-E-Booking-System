-- Seed a demo payment method for user id 1 (development only)
INSERT INTO payment_methods (user_id, provider, provider_token, brand, last4, exp_month, exp_year, is_default, billing_address, created_at, updated_at)
SELECT u.id, 'dev', 'tok_demo_visa_4242', 'Visa', '4242', 12, 2028, TRUE, 'Demo Address', NOW(), NOW()
FROM users u
WHERE u.id = 1
  AND NOT EXISTS (SELECT 1 FROM payment_methods pm WHERE pm.user_id = u.id AND pm.last4 = '4242');
