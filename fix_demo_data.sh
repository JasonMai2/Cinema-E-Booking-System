#!/bin/bash

# Script to fix demo data issues and populate real cinema data
# Run this script from the Cinema-E-Booking-System directory

echo "🎬 Fixing Cinema Booking System - Removing Demo Data"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if MySQL is running
echo -e "\n${YELLOW}1. Checking MySQL connection...${NC}"
if ! mysql -u root -p -e "SELECT 1" > /dev/null 2>&1; then
    echo -e "${RED}❌ Cannot connect to MySQL. Please ensure MySQL is running and you have credentials.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ MySQL connection OK${NC}"

# Seed the database
echo -e "\n${YELLOW}2. Populating database with movies, showtimes, and seats...${NC}"
echo "Please enter your MySQL root password when prompted:"

mysql -u root -p ecinema < seeds_movies.sql
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Movies seeded${NC}"
else
    echo -e "${RED}❌ Failed to seed movies${NC}"
fi

mysql -u root -p ecinema < seeds_showtimes.sql
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Showtimes, auditoriums, and seats seeded${NC}"
else
    echo -e "${RED}❌ Failed to seed showtimes${NC}"
fi

# Check if backend is running
echo -e "\n${YELLOW}3. Checking if backend is running...${NC}"
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running on port 8080${NC}"
    echo -e "${YELLOW}Note: You may need to restart the backend to pick up the new ShowtimeController${NC}"
    
    read -p "Would you like to restart the backend now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Stopping backend...${NC}"
        if [ -f backend.pid ]; then
            kill $(cat backend.pid) 2>/dev/null
            rm backend.pid
        else
            # Try to kill by port
            kill $(lsof -ti:8080) 2>/dev/null
        fi
        sleep 2
        
        echo -e "${YELLOW}Starting backend...${NC}"
        cd backend
        ./mvnw spring-boot:run > ../backend.log 2>&1 &
        BACKEND_PID=$!
        echo $BACKEND_PID > ../backend.pid
        cd ..
        echo -e "${GREEN}✅ Backend restarted (PID: $BACKEND_PID)${NC}"
        echo "Check backend.log for any errors"
    fi
else
    echo -e "${YELLOW}Backend is not running. Starting it now...${NC}"
    cd backend
    ./mvnw spring-boot:run > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid
    cd ..
    echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
    echo "Check backend.log for any errors"
fi

# Check if frontend is running
echo -e "\n${YELLOW}4. Checking if frontend is running...${NC}"
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is running on port 3000${NC}"
    echo -e "${YELLOW}Note: Refresh your browser to see the changes${NC}"
else
    echo -e "${YELLOW}Frontend is not running. Start it with:${NC}"
    echo "cd frontend && npm start"
fi

echo -e "\n${GREEN}=================================================="
echo "🎉 Setup Complete!"
echo "==================================================${NC}"
echo -e "\n${YELLOW}What was fixed:${NC}"
echo "✅ Removed demo movie data from ShowTimes.js"
echo "✅ Removed demo order generation from Checkout.js"
echo "✅ Removed demo mode from SeatSelection.js"
echo "✅ Added ShowtimeController.java for real API endpoints"
echo "✅ Seeded database with:"
echo "   - 10 movies (Inception, Matrix, etc.)"
echo "   - 3 auditoriums (Theater 1, 2, 3)"
echo "   - 300 seats total (120 + 100 + 80)"
echo "   - 100+ showtimes over next 7 days"
echo "   - Price rules ($10 adult, $5 child, $8 senior)"

echo -e "\n${YELLOW}Test the flow:${NC}"
echo "1. Open http://localhost:3000"
echo "2. Click on any movie from the homepage"
echo "3. Select a showtime"
echo "4. Select seats"
echo "5. Proceed to checkout"
echo "6. Fill in customer details"
echo "7. Continue to summary"
echo "8. Place order"

echo -e "\n${YELLOW}New API Endpoints:${NC}"
echo "GET  /api/movies/{movieId}/shows - Get showtimes for a movie"
echo "GET  /api/shows/{showId}/seats    - Get seat map for a showtime"
echo "POST /api/shows/{showId}/reserve  - Reserve seats (10 min lock)"

echo -e "\n${GREEN}Done! Your cinema booking system is now using real data.${NC}"
