import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import styles from '../../styles/sidepanel/Contact.module.css';
import Alert from '../../components/Alert/Alert';

const Contact = () => {
  const { userId, email: userEmail } = useAuth();
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [message, setMessage] = useState('');
  const [alertType, setAlertType] = useState('success');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/sidepanel/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, subject, content }),
      });

      if (response.ok) {
        setMessage('Email sent successfully');
        setAlertType('success');
        setSubject('');
        setContent('');
      } else {
        setMessage('Failed to send email');
        setAlertType('error');
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      setMessage('Failed to send email');
      setAlertType('error');
    }
  };

  return (
    <div className={styles.contact}>
      <h1>Contact Us</h1>
      <form onSubmit={handleSubmit} className={styles.contactForm}>
        <input
          type="text"
          name="subject"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
        <textarea
          name="content"
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <button type="submit" className={styles.submitButton}>Send Email</button>
      </form>
      {message && <Alert message={message} onClose={() => setMessage('')} type={alertType} />}
    </div>
  );
};

export default Contact;
