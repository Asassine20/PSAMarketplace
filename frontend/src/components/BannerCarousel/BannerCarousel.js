import React, { useState, useEffect } from 'react';
import './BannerCarousel.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock } from '@fortawesome/free-regular-svg-icons';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

const banners = [
  {
    class: 'banner-image-1',
    content: 'Shop For PSA Graded Cards From Top Rated Sellers',
    icon: null,
    imageSrc: [
        'https://www.psacard.com/cert/87570070', 
        'https://www.psacard.com/cert/88639660',
        'https://d1htnxwo4o0jhw.cloudfront.net/cert/127292720/357028721.jpg', 
        'https://www.psacard.com/cert/76267213',
        'https://www.psacard.com/cert/86505138' ]
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
  
    const navigateToPrevious = () => {
      setCurrentBannerIndex((prevIndex) => prevIndex === 0 ? banners.length - 1 : prevIndex - 1);
    };
  
    const navigateToNext = () => {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % banners.length);
    };
  
    return (
      <div className="banner-carousel-wrapper">
        <div className={`banner-container ${banners[currentBannerIndex].class}`}>
          <div className="banner-content">
            {banners[currentBannerIndex].icon}
            <span>{banners[currentBannerIndex].content}</span>
          </div>
        </div>
        <div className="banner-navigation">
          <FontAwesomeIcon icon={faChevronLeft} onClick={navigateToPrevious} className="banner-nav-arrow" />
          <div className="banner-indicators">
            {banners.map((_, index) => (
              <span key={index} className={`banner-indicator ${index === currentBannerIndex ? 'active' : ''}`} onClick={() => setCurrentBannerIndex(index)}></span>
            ))}
          </div>
          <FontAwesomeIcon icon={faChevronRight} onClick={navigateToNext} className="banner-nav-arrow" />
        </div>
      </div>
    );
  };
  
  export default BannerCarousel;