import React, { useState, useEffect } from 'react';
import './BannerCarousel.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock } from '@fortawesome/free-regular-svg-icons';

const banners = [
  {
    class: 'banner-image-1',
    content: 'Shop For PSA Graded Cards From Top Rated Sellers',
    icon: null,
  },
  {
    class: 'banner-image-2',
    content: 'Sell Cards In Seconds',
    icon: <FontAwesomeIcon icon={faClock} />,
  },
  {
    class: 'banner-image-3',
    content: 'Earn More With Zero Seller Fees',
    icon: null,
  },
];

const BannerCarousel = () => {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 3000); // Change banner every 3 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  const currentBanner = banners[currentBannerIndex];

  return (
    <div className={`banner-container ${currentBanner.class}`}>
      <div className="banner-content">
        {currentBanner.icon} {/* Directly render the icon as a React component */}
        <span>{currentBanner.content}</span> {/* Render banner text */}
      </div>
    </div>
  );
};

export default BannerCarousel; // This line should be outside of the BannerCarousel function
