import React, { useState, useEffect } from 'react';

function HomePage() {
  const [sports, setSports] = useState([]);
/*
  useEffect(() => {
    // Fetch sports from your API and set them to state
    fetch('/api/sports')
      .then((response) => response.json())
      .then((data) => setSports(data));
  }, []);
*/
  return (
    <div>
      <input type="text" placeholder="Search for CardName" />
      <h1>Hello</h1>
      <nav>
        {sports.map((sport) => (
          <a key={sport} href={`/sports/${sport}`}>{sport}</a>
        ))}
      </nav>
      <div className="banner">
        {/* Banner image here */}
      </div>
      {/* Additional content */}
    </div>
  );
}

export default HomePage;

