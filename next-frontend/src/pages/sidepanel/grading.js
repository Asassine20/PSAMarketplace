import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import useAuth from '../../hooks/useAuth'; // Import useAuth hook
import styles from '../../styles/sidepanel/Grading.module.css';

const Grading = () => {
  const { userId, accessToken } = useAuth(); // Destructure userId and accessToken from useAuth
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [faqItems, setFaqItems] = useState([
    { question: "What is PSA grading?", answer: "PSA grading is a process where experts evaluate the condition and authenticity of trading cards.", open: false },
    { question: "How long does the grading process take?", answer: "The grading process can take anywhere from a few weeks to several months, depending on the service level selected.", open: false },
    { question: "What are the costs involved?", answer: "The costs vary based on the service level and the number of cards submitted. Check our pricing page for more details.", open: false },
    { question: "How can I track my grading submission status?", answer: "The costs vary based on the service level and the number of cards submitted. Check our pricing page for more details.", open: false },
  ]);
  const router = useRouter();

  const fetchSubmissions = useCallback(async () => {
    if (!accessToken) return;

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      };

      const response = await fetch('/api/sidepanel/submissions', { headers });

      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      } else {
        console.error('Failed to fetch submissions');
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  }, [accessToken]);

  useEffect(() => {
    const loggedIn = !!accessToken; // Check if accessToken exists
    setIsLoggedIn(loggedIn);

    if (loggedIn) {
      fetchSubmissions();
    }
  }, [accessToken, fetchSubmissions]);

  const handleStartSubmission = () => {
    router.push('/submission-form');
  };

  const toggleFaqItem = index => {
    setFaqItems(faqItems.map((item, i) => i === index ? { ...item, open: !item.open } : item));
  };

  const transformStepValue = (step) => {
    if (!step) {
      return 'In Progress';
    }
    return step
      .replace(/([A-Z])/g, ' $1') // Insert space before each uppercase letter
      .replace(/I D/g, 'ID') // Correct 'I D' to 'ID'
      .trim() // Remove leading/trailing spaces
      .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize the first letter of each word
  };

  const getCurrentStep = (orderProgressSteps) => {
    const firstIncompleteStep = orderProgressSteps.find(step => !step.completed);
    return firstIncompleteStep ? transformStepValue(firstIncompleteStep.step) : 'Completed';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>PSA Grading Submission</h1>
        <button className={styles.startButton} onClick={handleStartSubmission}>Start Submission</button>
      </div>
      <div className={styles.tableContainer}>
        <h2>Submission History</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Submission #</th>
              <th>Service Level</th>
              <th>Items</th>
              <th>Current Step</th>
              <th>Tracking #</th>
              <th>Date Submitted</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoggedIn ? (
              submissions.length > 0 ? (
                submissions.map((submission, index) => (
                  <tr key={index}>
                    <td>{submission.submissionNumber}</td>
                    <td>{submission.ServiceLevel}</td>
                    <td>{submission.ItemCount}</td>
                    <td>
                      {submission.OrderProgress ? getCurrentStep(submission.OrderProgress.orderProgressSteps) : ''}
                    </td>
                    <td>{submission.TrackingNumber}</td>
                    <td>{new Date(submission.DateSubmitted).toLocaleDateString()}</td>
                    <td>{submission.Status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">No submission history</td>
                </tr>
              )
            ) : (
              <tr>
                <td colSpan="7">
                  <Link href={{ pathname: '/login', query: { redirect: '/grading' } }}>Log in</Link> to view your submission history
                </td>
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
