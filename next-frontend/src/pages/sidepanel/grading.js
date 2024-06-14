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
    { question: "What is the detailed process when grading through GemTCG?", answer: "At GemTCG, we offer lowered rates so you can save money on your grading costs, and the return shipping is free! After you ship your cards to us for grading, we send them to PSA within 2-5 days. After your grades are ready and returned back to us, we list them on the GemTCG marketplace. When they sell, you get all of the earnings with no fees attached. All orders shipped from us are packaged and shipped safe and secure to ensure an exceptional customer experience.", open: false },
    { question: "What happens if my cards don't sell / Can I have them shipped directly back to me?", answer: "If you're cards don't sell within 6 months, you can request to have them shipped back to you at no cost. If you wish to have them shipped back to you before 6 months, there will be an additional $5 charge per card.", open: false },
    { question: "How long does the grading process take?", answer: "The grading process can take anywhere from a few weeks to a few months, depending on the service level selected.", open: false },
    { question: "What are the costs involved?", answer: "The costs vary based on the service level chosen. We offer reduced rates and competitive pricing. You will only be charged for the grading fees (and insurance if you choose), and we will cover the rest.", open: false },
    { question: "How can I track my grading submission status?", answer: "We utilize PSA's public API's to track your order that updates in real time. Check back to this page often to see the current step of your submission.", open: false },
    { question: "What happens if my package is lost in transit or gets damaged?", answer: "If you're package or cards are damaged/lost in transit from PSA back to us, you will be fully reimbursed based on the insurance amount you selected.", open: false },
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

  const getTrackingUrl = (trackingNumber) => {
    const uspsRegex = /^94[0-9]{20}$/;
    const upsRegex = /^1Z[0-9A-Z]{16}$/;
    const fedexRegex = /^[0-9]{12,15}$/;

    if (uspsRegex.test(trackingNumber)) {
      return `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${trackingNumber}`;
    } else if (upsRegex.test(trackingNumber)) {
      return `https://www.ups.com/track?loc=en_US&track.x=Track&trackNums=${trackingNumber}&requester=ST/trackdetails`;
    } else if (fedexRegex.test(trackingNumber)) {
      return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}&trkqual=2460476000~${trackingNumber}~FX`;
    } else {
      return null; // Return null if the tracking number doesn't match any pattern
    }
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
              <th>Tracking</th>
              <th>Date Submitted</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoggedIn ? (
              submissions.length > 0 ? (
                submissions.map((submission, index) => (
                  <tr key={index}>
                    <td>
                      <Link legacyBehavior href={`/sidepanel/submission-details?id=${submission.submissionNumber}`}>
                        <a>{submission.submissionNumber}</a>
                      </Link>
                    </td>
                    <td>{submission.ServiceLevel}</td>
                    <td>{submission.ItemCount}</td>
                    <td>
                      {submission.OrderProgress ? getCurrentStep(submission.OrderProgress.orderProgressSteps) : ''}
                    </td>
                    <td>
                      {submission.TrackingNumber ? (
                        <a href={getTrackingUrl(submission.TrackingNumber)} target="_blank" rel="noopener noreferrer">
                          {submission.TrackingNumber}
                        </a>
                      ) : (
                        ''
                      )}
                    </td>
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
