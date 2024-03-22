// Assuming HomePage was your React app's homepage component
import React from 'react';
import Navbar from '../components/Navbar/Navbar'; // If needed, but you already include Navbar in _app.js
import HomePage from '../components/HomePage/HomePage'; // Adjust the import path as needed

export default function Home() {
  return <HomePage />;
}
