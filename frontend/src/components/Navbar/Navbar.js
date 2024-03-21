// Navbar.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [sports, setSports] = useState([]);

  useEffect(() => {
    // Fetch sports categories from your server
    fetch('/nav-sports')
      .then(response => response.json())
      .then(data => setSports(data))
      .catch(error => console.error('Error fetching sports:', error));
  }, []);

  return (
    <div>
      <div className="search-bar-container">
        <form className="search-form">
          <input type="text" placeholder="Search for cards..." />
          <button type="submit">
            <i class="fas fa-search"></i>
          </button>
        </form>
      </div>
      <nav className="navbar">
        <div className="sports-links">
          {sports.map((sport, index) => (
            <Link key={index} to={`/sports/${sport.toLowerCase()}`} className="nav-link">{sport}</Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
