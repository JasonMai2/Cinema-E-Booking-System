import React from "react";

export default function Header() {
    return (
        <header style={{padding: '10px', backgroundColor: '#7d1b1d', color: '#fff'}}>
            <h2>Cinema E-Booking</h2>
            <nav>
                <a href="/" style={{ marginRight: "1rem", color: "#fff" }}>Home</a>
                <a href="/movies" style={{ marginRight: "1rem", color: "#fff" }}>Movies</a>
                <a href="/bookings" style={{ color: "#fff" }}>My Bookings</a>
            </nav>
        </header>
    );
}