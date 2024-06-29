import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import styles from './BannerCarousel.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

const banners = [
  {
    class: styles.bannerImage1,
    content: 'Shop For PSA Graded Cards From Top Rated Sellers',
    icon: null,
    button: {
      text: 'Shop Now',
      url: '/search?cardName=&page=1&inStock=true'
    },
    images: [
      'https://d1htnxwo4o0jhw.cloudfront.net/cert/154592358/4w2WeHLJ_EaXv3fmYB-djA.jpg',
      'https://d1htnxwo4o0jhw.cloudfront.net/cert/142410235/wy6-8FkID02Zocr536Xedg.jpg',
      'https://d1htnxwo4o0jhw.cloudfront.net/cert/127292720/357028721.jpg',
      'https://d1htnxwo4o0jhw.cloudfront.net/cert/155604130/U0NwRHbjT0y59a_o4Ti1Lg.jpg',
      'https://d1htnxwo4o0jhw.cloudfront.net/cert/153286242/iWSyVG4UzUyzuOBmjsD2LQ.jpg'
    ]
  },
  {
    class: styles.bannerImage2,
    content: 'List Cards In Seconds',
    icon: null,
    button: {
      text: 'Start Selling',
      url: 'http://localhost:3001/register'
    },
    images: [
      'https://d1htnxwo4o0jhw.cloudfront.net/cert/154267273/GP2HfHlLVUWjpdZesxKgjg.jpg',
      'https://d1htnxwo4o0jhw.cloudfront.net/cert/131673031/kARb8BfhA0GYFWYOLK6DiQ.jpg',
      'https://d1htnxwo4o0jhw.cloudfront.net/cert/138710615/HA4_Q18RIUiaXvzyTFVTTA.jpg',
      'https://d1htnxwo4o0jhw.cloudfront.net/cert/132689436/yqLZCPcUxEeo8rx9m8Fpug.jpg',
      'https://d1htnxwo4o0jhw.cloudfront.net/cert/151745671/KXL_OkYz-kKNClEDUpGo0w.jpg'
    ]
  },
  {
    class: styles.bannerImage3,
    content: 'Earn More With Zero Seller Fees',
    icon: null,
    button: {
      text: 'Learn More',
      url: 'http://localhost:3001/articles'
    },
    images: [
      'https://d1htnxwo4o0jhw.cloudfront.net/cert/126889271/356421395.jpg',
      'https://d1htnxwo4o0jhw.cloudfront.net/cert/155109986/14g4QNGMfkiNpdZ2IKBLRA.jpg',
      'https://d1htnxwo4o0jhw.cloudfront.net/cert/153177160/cEj19vcd5kWKfIMN-iC38A.jpg',
      'https://d1htnxwo4o0jhw.cloudfront.net/cert/138498058/ZTQYf8LPcEKWJZQTvD0j3Q.jpg',
      'https://d1htnxwo4o0jhw.cloudfront.net/cert/153135854/zETzhtIPBEukV2b6_CpAxA.jpg'



    ]
  }
];

const BannerCarousel = () => {
  const navigate = useRouter();
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const intervalRef = useRef(null);
  const resetTimer = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 10000);
  };

  useEffect(() => {
    resetTimer();
    return () => clearInterval(intervalRef.current); // Cleanup on unmount
  }, [currentBannerIndex]);
  const navigateToPrevious = () => {
    setCurrentBannerIndex((prevIndex) => prevIndex === 0 ? banners.length - 1 : prevIndex - 1);
    resetTimer();
  };

  const navigateToNext = () => {
    setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % banners.length);
    resetTimer();
  };

  const handleCircleClick = (index) => {
    setCurrentBannerIndex(index);
    resetTimer();
  };

  const handleButtonClick = (url, newTab) => {
    if (newTab) {
        window.open(url, '_blank');
    } else {
        navigate.push(url);
    }
};
  const currentBanner = banners[currentBannerIndex];

  return (
    <div className={styles.bannerCarouselWrapper}>
      <div className={`${styles.bannerContainer} ${banners[currentBannerIndex].class}`}>
        <div className={styles.imagesContainer}>
          {banners[currentBannerIndex].images.map((imgSrc, index) => (
            <img key={index} src={imgSrc} alt={`Banner image ${index + 1}`} className={styles.bannerImage} />
          ))}
        </div>
        <div className={styles.bannerContent}>
          <span>{banners[currentBannerIndex].content}</span>
          {banners[currentBannerIndex].button && (
            <button onClick={() => handleButtonClick(banners[currentBannerIndex].button.url, ['Start Selling', 'Learn More'].includes(banners[currentBannerIndex].button.text))} className={styles.bannerButton}>
              {banners[currentBannerIndex].button.text}
            </button>
          )}
        </div>
      </div>
      <div className={styles.bannerNavigation}>
        <FontAwesomeIcon icon={faChevronLeft} onClick={() => setCurrentBannerIndex(currentBannerIndex === 0 ? banners.length - 1 : currentBannerIndex - 1)} className={styles.bannerNavArrow} />
        <div className={styles.bannerIndicators}>
          {banners.map((_, index) => (
            <span key={index} onClick={() => setCurrentBannerIndex(index)} className={`${styles.bannerIndicator} ${index === currentBannerIndex ? styles.active : ''}`}></span>
          ))}
        </div>
        <FontAwesomeIcon icon={faChevronRight} onClick={() => setCurrentBannerIndex((currentBannerIndex + 1) % banners.length)} className={styles.bannerNavArrow} />
      </div>
    </div>
  );
};


export default BannerCarousel;
