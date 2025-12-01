#!/bin/bash

# 🧪 Quick Test Script for Cinema E-Booking System
# This script performs automated API tests on your checkout flow

echo "🎬 Cinema E-Booking System - Payment Flow Test"
echo "================================================"
echo ""

# Configuration
BACKEND_URL="http://localhost:8080"
BACKEND_READY=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# Step 1: Check if backend is running
echo "Step 1: Checking backend connection..."
if curl -s "${BACKEND_URL}/api/movies/ping" > /dev/null 2>&1; then
    print_success "Backend is running at ${BACKEND_URL}"
    BACKEND_READY=true
else
    print_error "Backend is not responding at ${BACKEND_URL}"
    print_warning "Please start the backend first:"
    echo "   cd backend && ./mvnw spring-boot:run"
    exit 1
fi

echo ""

# Step 2: Test Now Playing endpoint
echo "Step 2: Testing 'Now Playing' endpoint..."
NOW_PLAYING=$(curl -s "${BACKEND_URL}/api/movies/now-playing")
if [ $? -eq 0 ]; then
    COUNT=$(echo "$NOW_PLAYING" | grep -o '"id"' | wc -l)
    print_success "Now Playing endpoint working - Found $COUNT movies"
else
    print_error "Now Playing endpoint failed"
fi

echo ""

# Step 3: Test Coming Soon endpoint
echo "Step 3: Testing 'Coming Soon' endpoint..."
COMING_SOON=$(curl -s "${BACKEND_URL}/api/movies/coming-soon")
if [ $? -eq 0 ]; then
    COUNT=$(echo "$COMING_SOON" | grep -o '"id"' | wc -l)
    print_success "Coming Soon endpoint working - Found $COUNT movies"
else
    print_error "Coming Soon endpoint failed"
fi

echo ""

# Step 4: Test checkout WITHOUT promo code
echo "Step 4: Testing checkout WITHOUT promo code..."
RESPONSE=$(curl -s -X POST "${BACKEND_URL}/api/checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "showtimeId": 1,
    "selectedSeats": [
      {"seatId": 1, "ageCategory": "ADULT"},
      {"seatId": 2, "ageCategory": "ADULT"}
    ],
    "cardInfo": {
      "cardNumber": "4111111111111111",
      "cvv": "123",
      "expMonth": 12,
      "expYear": 2026,
      "billingAddress": "123 Test St"
    }
  }')

if echo "$RESPONSE" | grep -q '"success":true'; then
    print_success "Checkout WITHOUT promo code: SUCCESS"
    BOOKING_NUM=$(echo "$RESPONSE" | grep -o '"bookingNumber":"[^"]*"' | head -1 | cut -d'"' -f4)
    print_info "Booking Number: $BOOKING_NUM"
    TOTAL=$(echo "$RESPONSE" | grep -o '"totalCents":[0-9]*' | head -1 | cut -d':' -f2)
    print_info "Total: $TOTAL cents ($((TOTAL / 100)).$((TOTAL % 100)))"
else
    print_error "Checkout WITHOUT promo code: FAILED"
    print_warning "Response: $RESPONSE"
fi

echo ""

# Step 5: Test checkout WITH valid promo code (if exists)
echo "Step 5: Testing checkout WITH valid promo code..."
RESPONSE=$(curl -s -X POST "${BACKEND_URL}/api/checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "showtimeId": 1,
    "selectedSeats": [
      {"seatId": 3, "ageCategory": "ADULT"},
      {"seatId": 4, "ageCategory": "ADULT"}
    ],
    "cardInfo": {
      "cardNumber": "4111111111111111",
      "cvv": "123",
      "expMonth": 12,
      "expYear": 2026,
      "billingAddress": "123 Test St"
    },
    "promoCode": "SUMMER2025"
  }')

if echo "$RESPONSE" | grep -q '"success":true'; then
    print_success "Checkout WITH promo code 'SUMMER2025': SUCCESS"
    PROMO_NAME=$(echo "$RESPONSE" | grep -o '"promotionApplied":"[^"]*"' | cut -d'"' -f4)
    if [ ! -z "$PROMO_NAME" ]; then
        print_success "Promotion Applied: $PROMO_NAME"
    fi
    BOOKING_NUM=$(echo "$RESPONSE" | grep -o '"bookingNumber":"[^"]*"' | head -1 | cut -d'"' -f4)
    print_info "Booking Number: $BOOKING_NUM"
    TOTAL=$(echo "$RESPONSE" | grep -o '"totalCents":[0-9]*' | head -1 | cut -d':' -f2)
    print_info "Total: $TOTAL cents ($((TOTAL / 100)).$((TOTAL % 100)))"
else
    print_warning "Checkout WITH promo code 'SUMMER2025': FAILED (Promo may not exist in DB)"
    ERROR=$(echo "$RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    if [ ! -z "$ERROR" ]; then
        print_info "Error: $ERROR"
    fi
fi

echo ""

# Step 6: Test checkout WITH inactive promo code
echo "Step 6: Testing checkout WITH inactive promo code..."
RESPONSE=$(curl -s -X POST "${BACKEND_URL}/api/checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "showtimeId": 1,
    "selectedSeats": [
      {"seatId": 5, "ageCategory": "ADULT"}
    ],
    "cardInfo": {
      "cardNumber": "4111111111111111",
      "cvv": "123",
      "expMonth": 12,
      "expYear": 2026,
      "billingAddress": "123 Test St"
    },
    "promoCode": "INACTIVE30"
  }')

if echo "$RESPONSE" | grep -q '"success":false'; then
    ERROR=$(echo "$RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    if echo "$ERROR" | grep -iq "inactive"; then
        print_success "Inactive promo code correctly REJECTED"
        print_info "Error Message: $ERROR"
    else
        print_warning "Promo rejected but error message unexpected"
        print_info "Error: $ERROR"
    fi
else
    print_warning "Inactive promo code test: Promo may not exist in DB"
fi

echo ""

# Step 7: Test checkout WITH invalid promo code
echo "Step 7: Testing checkout WITH invalid promo code..."
RESPONSE=$(curl -s -X POST "${BACKEND_URL}/api/checkout" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "showtimeId": 1,
    "selectedSeats": [
      {"seatId": 6, "ageCategory": "ADULT"}
    ],
    "cardInfo": {
      "cardNumber": "4111111111111111",
      "cvv": "123",
      "expMonth": 12,
      "expYear": 2026,
      "billingAddress": "123 Test St"
    },
    "promoCode": "INVALIDCODE123"
  }')

if echo "$RESPONSE" | grep -q '"success":false'; then
    ERROR=$(echo "$RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    print_success "Invalid promo code correctly REJECTED"
    print_info "Error Message: $ERROR"
else
    print_error "Invalid promo code should have been rejected!"
fi

echo ""
echo "================================================"
echo "🎬 Test Summary"
echo "================================================"
print_info "Check the results above to verify all tests passed"
print_info "Backend logs in your terminal should show:"
print_info "  - 'FakePaymentGatewayProxy' being used"
print_info "  - 'FAKE CHARGE' messages"
print_info "  - Promotion validation messages"
echo ""
print_warning "Note: Some tests may fail if test data doesn't exist in database"
print_info "Run the SQL scripts in TESTING_GUIDE.md Step 4 to create test data"
echo ""
