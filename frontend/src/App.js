import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import HomePage from './components/HomePage/HomePage';
import './App.css'; // Importing the App.css file


function App() {
  return (
    <Router>
      <Navbar /> {/* This ensures Navbar is always visible */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* Define other routes here */}
      </Routes>
    </Router>
  );
}

export default App;
