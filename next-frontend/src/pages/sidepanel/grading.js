import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../../styles/sidepanel/Grading.module.css';

const Grading = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [faqItems, setFaqItems] = useState([
    { question: "What is PSA grading?", answer: "PSA grading is a process where experts evaluate the condition and authenticity of trading cards.", open: false },
    { question: "How long does the grading process take?", answer: "The grading process can take anywhere from a few weeks to several months, depending on the service level selected.", open: false },
    { question: "What are the costs involved?", answer: "The costs vary based on the service level and the number of cards submitted. Check our pricing page for more details.", open: false },
    { question: "How can I track my grading submission status?", answer: "The costs vary based on the service level and the number of cards submitted. Check our pricing page for more details.", open: false },
  ]);
  const router = useRouter();

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);

    if (loggedIn) {
      fetch('/api/sidepanel/submissions')
        .then(response => response.json())
        .then(data => setSubmissions(data))
        .catch(error => console.error('Error fetching submissions:', error));
    }
  }, []);

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
              <th>Current Step</th>
              <th>Items</th>
              <th>Service Level</th>
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
                    <td>
                      {submission.OrderProgress ? getCurrentStep(submission.OrderProgress.orderProgressSteps) : 'N/A'}
                    </td>
                    <td>{submission.ItemCount}</td>
                    <td>{submission.ServiceLevel}</td>
                    <td>{new Date(submission.DateSubmitted).toLocaleDateString()}</td>
                    <td>{submission.Status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No submission history</td>
                </tr>
              )
            ) : (
              <tr>
                <td colSpan="6">
                  <Link href="/login">Log in</Link> to view your submission history
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
