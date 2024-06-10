import React, { useState } from 'react';
import styles from '../../styles/sidepanel/SubmissionForm.module.css';

const SubmissionForm = () => {
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { number: 1, label: 'Submission Level' },
    { number: 2, label: 'Cards' },
    { number: 3, label: 'Submission Details' },
    { number: 4, label: 'Confirm Submission' }
  ];

  const handleNextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h2>Submission Level</h2>
            <table className={styles.pricingTable}>
              <thead>
                <tr>
                  <th></th>
                  <th>Submission Level</th>
                  <th>Max Declared Value/item</th>
                  <th>Price/item</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><div className={styles.radioContainer}><input type="radio" name="submissionLevel" className={styles.largeRadioButton} /></div></td>
                  <td>
                    <div className={styles.headerContainer}>
                      Trading Card Game and Non-Sports Bulk
                      <div className={styles.subHeader}>20 Card Minimum</div>
                      <div className={styles.subHeader}>45 Business Days</div>
                    </div>
                  </td>
                  <td>$200</td>
                  <td>$13.99</td>
                </tr>
                <tr>
                  <td><div className={styles.radioContainer}><input type="radio" name="submissionLevel" className={styles.largeRadioButton} /></div></td>
                  <td>
                    <div className={styles.headerContainer}>
                      June 1980-Present Special
                      <div className={styles.subHeader}>10 Card Minimum</div>
                      <div className={styles.subHeader}>50 Business Days</div>
                    </div>
                  </td>
                  <td>$300</td>
                  <td>$14.99</td>
                </tr>
                <tr>
                  <td><div className={styles.radioContainer}><input type="radio" name="submissionLevel" className={styles.largeRadioButton} /></div></td>
                  <td>
                    <div className={styles.headerContainer}>
                      Value Bulk (1979-Older)
                      <div className={styles.subHeader}>20 Card Minimum</div>
                      <div className={styles.subHeader}>45 Business Days</div>
                    </div>
                  </td>
                  <td>$500</td>
                  <td>$17.99</td>
                </tr>
                <tr>
                  <td><div className={styles.radioContainer}><input type="radio" name="submissionLevel" className={styles.largeRadioButton} /></div></td>
                  <td>
                    <div className={styles.headerContainer}>
                      Value Bulk (1980-Present)
                      <div className={styles.subHeader}>20 Card Minimum</div>
                      <div className={styles.subHeader}>45 Business Days</div>
                    </div>
                  </td>
                  <td>$500</td>
                  <td>$17.99</td>
                </tr>
                <tr>
                  <td><div className={styles.radioContainer}><input type="radio" name="submissionLevel" className={styles.largeRadioButton} /></div></td>
                  <td>
                    <div className={styles.headerContainer}>
                      Value (1979-Older)
                    </div>
                    <div className={styles.subHeader}>45 Business Days</div>
                  </td>
                  <td>$500</td>
                  <td>$23.99</td>
                </tr>
                <tr>
                  <td><div className={styles.radioContainer}><input type="radio" name="submissionLevel" className={styles.largeRadioButton} /></div></td>
                  <td>
                    <div className={styles.headerContainer}>
                      Value (1980-Present)
                    </div>
                    <div className={styles.subHeader}>45 Business Days</div>
                  </td>
                  <td>$500</td>
                  <td>$23.99</td>
                </tr>
                <tr>
                  <td><div className={styles.radioContainer}><input type="radio" name="submissionLevel" className={styles.largeRadioButton} /></div></td>
                  <td>
                    <div className={styles.headerContainer}>
                      Value Plus
                    </div>
                    <div className={styles.subHeader}>20 Business Days</div>
                  </td>
                  <td>$500</td>
                  <td>$38.99</td>
                </tr>
                <tr>
                  <td><div className={styles.radioContainer}><input type="radio" name="submissionLevel" className={styles.largeRadioButton} /></div></td>
                  <td>
                    <div className={styles.headerContainer}>
                      Regular
                      <div className={styles.subHeader}>10 Business Dats</div>
                    </div>
                  </td>
                  <td>$1500</td>
                  <td>$73.99</td>
                </tr>
                <tr>
                  <td><div className={styles.radioContainer}><input type="radio" name="submissionLevel" className={styles.largeRadioButton} /></div></td>
                  <td>
                    <div className={styles.headerContainer}>
                      Express
                      <div className={styles.subHeader}>5 Business Days</div>
                    </div>
                  </td>
                  <td>$2500</td>
                  <td>$124.99</td>
                </tr>
                <tr>
                  <td><div className={styles.radioContainer}><input type="radio" name="submissionLevel" className={styles.largeRadioButton} /></div></td>
                  <td>
                    <div className={styles.headerContainer}>
                      Super Express
                      <div className={styles.subHeader}>5 Business Days</div>
                    </div>
                  </td>
                  <td>$5000</td>
                  <td>$244.99</td>
                </tr>
              </tbody>
            </table>
            <div className={styles.buttonContainer}>
              <div></div>
              <button className={styles.navigationButton} onClick={handleNextStep}>Next</button>
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <h2>Cards</h2>
            {/* Content for Cards step */}
            <div className={styles.buttonContainer}>
              <button className={styles.navigationButton} onClick={handlePreviousStep}>Previous</button>
              <button className={styles.navigationButton} onClick={handleNextStep}>Next</button>
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <h2>Submission Details</h2>
            {/* Content for Submission Details step */}
            <div className={styles.buttonContainer}>
              <button className={styles.navigationButton} onClick={handlePreviousStep}>Previous</button>
              <button className={styles.navigationButton} onClick={handleNextStep}>Next</button>
            </div>
          </div>
        );
      case 4:
        return (
          <div>
            <h2>Confirm Submission</h2>
            {/* Content for Confirm Submission step */}
            <div className={styles.buttonContainer}>
              <button className={styles.navigationButton} onClick={handlePreviousStep}>Previous</button>
              <button className={styles.navigationButton} onClick={handleNextStep}>Submit</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <div className={styles.steps}>
          {steps.map(step => (
            <div
              key={step.number}
              className={`${styles.step} ${currentStep === step.number ? styles.active : ''}`}
            >
              <div className={styles.stepNumber}>{step.number}</div>
              <div className={styles.stepLabel}>{step.label}</div>
            </div>
          ))}
        </div>
        <div className={styles.content}>
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
};

export default SubmissionForm;
