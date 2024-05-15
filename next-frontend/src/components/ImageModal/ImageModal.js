import React, { useState } from 'react';
import styles from './ImageModal.module.css';

const ImageModal = ({ images, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
  const [isFlipping, setIsFlipping] = useState(false);

  const handlePrev = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : images.length - 1));
      setIsFlipping(false);
    }, 300);
  };

  const handleNext = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex < images.length - 1 ? prevIndex + 1 : 0));
      setIsFlipping(false);
    }, 300);
  };

  const handleImageClick = () => {
    setIsZoomed(!isZoomed);
  };

  const handleMouseMove = (e) => {
    if (isZoomed) {
      const { offsetX, offsetY, target } = e.nativeEvent;
      const { offsetWidth, offsetHeight } = target;
      const x = (offsetX / offsetWidth) * 100;
      const y = (offsetY / offsetHeight) * 100;
      setLensPosition({ x, y });
    }
  };

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>&times;</button>
        <button className={styles.prevButton} onClick={handlePrev}>&#8249;</button>
        <div className={styles.imageContainer}>
          <div
            className={`${styles.imageWrapper} ${isFlipping ? styles.flip : ''} ${isZoomed ? styles.zoomedWrapper : ''}`}
            onClick={handleImageClick}
            onMouseMove={handleMouseMove}
          >
            {!isZoomed && <div className={styles.zoomButton}>Click to Zoom</div>}
            <img
              src={images[currentIndex]}
              alt="Enlarged"
              className={`${styles.modalImage} ${isZoomed ? styles.zoomed : ''}`}
              style={isZoomed ? { transformOrigin: `${lensPosition.x}% ${lensPosition.y}%` } : {}}
            />
          </div>
        </div>
        <button className={styles.nextButton} onClick={handleNext}>&#8250;</button>
      </div>
    </div>
  );
};

export default ImageModal;
