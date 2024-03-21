import React, { useState, useEffect } from 'react';

function HomePage() {
  const [sports, setSports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Fetch sports from the backend
    fetch('/sports')
      .then(response => response.json())
      .then(data => setSports(data))
      .catch(error => console.error('Error fetching sports:', error));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality or navigate to a search results page
    console.log('Searching for:', searchTerm);
    // Example: navigate to '/search?term=' + searchTerm
  };

  return (
    <div className="homepage-content">
      <h1>Welcome to Our Card Collection</h1>
      <p>This is the starting point for exploring our extensive collection of sports cards. Use the search bar and sports categories in the navigation bar above to find cards of interest.</p>
      {/* Add more homepage-specific content here */}
    </div>
  );
}

export default HomePage;
