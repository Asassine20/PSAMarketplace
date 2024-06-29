import React, { useState } from 'react';
import styles from './FeedbackModal.module.css';

const FeedbackModal = ({ isOpen, onClose, order, userId }) => {
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState(0);
  const maxCharacters = 300;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const feedbackData = {
      SellerID: order.SellerID,
      BuyerID: userId,
      FeedbackText: feedbackText || null,
      Rating: rating,
      FeedbackDate: new Date().toISOString(),
      OrderNumber: order.OrderNumber
    };

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData)
      });
      if (response.ok) {
        onClose();
      } else {
        console.error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2>Leave Feedback</h2>
        <form onSubmit={handleSubmit}>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Enter your feedback (optional)"
            maxLength={maxCharacters}
            className={styles.feedbackTextarea}
          />
          <p className={styles.characterLimit}>
            {feedbackText.length}/{maxCharacters} characters
          </p>
          <div className={styles.starRating}>
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={styles.star}
                style={{ color: rating >= star ? '#FFD700' : '#ccc' }}
                onClick={() => setRating(star)}
              >
                &#9733;
              </span>
            ))}
          </div>
          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.modalButton}>
              Cancel
            </button>
            <button type="submit" className={styles.modalButton}>
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
