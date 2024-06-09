import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/sidepanel/Grading.module.css'; // Updated path

const Grading = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [faqItems, setFaqItems] = useState([
    { question: "What is PSA grading?", answer: "PSA grading is a process where experts evaluate the condition and authenticity of trading cards.", open: false },
    { question: "How long does the grading process take?", answer: "The grading process can take anywhere from a few weeks to several months, depending on the service level selected.", open: false },
    { question: "What are the costs involved?", answer: "The costs vary based on the service level and the number of cards submitted. Check our pricing page for more details.", open: false }
  ]);
  const router = useRouter();

  useEffect(() => {
    // Check login status
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);

    if (loggedIn) {
      // Fetch submission data from the API
      fetch('/api/sidepanel/submissions')
        .then(response => response.json())
        .then(data => setSubmissions(data))
        .catch(error => console.error('Error fetching submissions:', error));
    }
  }, []);

  const handleStartSubmission = () => {
    router.push('/submission-form'); // Change this to the actual path of the submission form page
  };

  const toggleFaqItem = index => {
    setFaqItems(faqItems.map((item, i) => i === index ? { ...item, open: !item.open } : item));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>PSA Grading Submission</h1>
        <button className={styles.startButton} onClick={handleStartSubmission}>Start Submission</button>
      </div>
      <div className={styles.banner}>
        <img src="/images/gradingBanner.png" alt="PSA Banner" className={styles.bannerImage} />
      </div>
      <div className={styles.tableContainer}>
        <h2>Submission History</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Submission #</th>
              <th>Items</th>
              <th>Service Level</th>
              <th>Date Completed</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoggedIn ? (
              submissions.length > 0 ? (
                submissions.map((submission, index) => (
                  <tr key={index}>
                    <td>{submission.submissionNumber}</td>
                    <td>{submission.items}</td>
                    <td>{submission.serviceLevel}</td>
                    <td>{submission.dateCompleted}</td>
                    <td>{submission.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No submissions found</td>
                </tr>
              )
            ) : (
              <tr>
                <td colSpan="5">Log in to see your submission history</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className={styles.faqSection}>
        <h2>Frequently Asked Questions</h2>
        {faqItems.map((item, index) => (
          <div key={index} className={styles.faqItem}>
            <div className={styles.faqQuestion} onClick={() => toggleFaqItem(index)}>
              {item.question}
            </div>
            {item.open && (
              <div className={styles.faqAnswer}>
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Grading;
