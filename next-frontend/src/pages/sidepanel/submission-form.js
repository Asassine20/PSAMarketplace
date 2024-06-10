import React, { useState } from 'react';
import styles from '../../styles/sidepanel/SubmissionForm.module.css';

const SubmissionForm = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [submissionLevel, setSubmissionLevel] = useState('');
    const [cards, setCards] = useState([{ year: '', set: '', number: '', name: '', type: '' }]);
    const [submissionDetails, setSubmissionDetails] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [cardCount, setCardCount] = useState(0);

    const steps = [
        { number: 1, label: 'Submission Level' },
        { number: 2, label: 'Cards' },
        { number: 3, label: 'Submission Details' },
        { number: 4, label: 'Confirm Submission' }
    ];

    const handleNextStep = () => {
        if (currentStep === 1 && !submissionLevel) {
            setAlertMessage('Please select a submission level before continuing');
            return;
        }
        if (currentStep === 2 && cards.length === 0) {
            setAlertMessage('Please add at least one card before continuing');
            return;
        }
        if (currentStep === 3 && !submissionDetails) {
            setAlertMessage('Please fill in the submission details before continuing');
            return;
        }
        if (currentStep < steps.length) {
            setAlertMessage('');
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePreviousStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmissionLevelChange = (event) => {
        setSubmissionLevel(event.target.value);
    };

    const handleAddCard = () => {
        setCards([...cards, { year: '', set: '', number: '', name: '', type: '' }]);
    };
    const handleRemoveCard = (index) => {
        const newCards = cards.filter((_, i) => i !== index);
        setCards(newCards);
      };

    const handleCardChange = (index, field, value) => {
        const newCards = [...cards];
        newCards[index][field] = value;
        setCards(newCards);
    };

    const handleModalOpen = () => {
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
    };

    const handleCardCountChange = (event) => {
        setCardCount(event.target.value);
    };

    const handleCardCountSubmit = () => {
        setCards(Array.from({ length: cardCount }, () => ({ year: '', set: '', number: '', name: '', type: '' })));
        handleModalClose();
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div>
                        {alertMessage && <div className={styles.alert}>{alertMessage}</div>}
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
                                    <td><div className={styles.radioContainer}><input type="radio" name="submissionLevel" value="Trading Card Game" className={styles.largeRadioButton} onChange={handleSubmissionLevelChange} /></div></td>
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
                                    <td><div className={styles.radioContainer}><input type="radio" name="submissionLevel" value="June 1980-Present Special" className={styles.largeRadioButton} onChange={handleSubmissionLevelChange} /></div></td>
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
                                    <td><div className={styles.radioContainer}><input type="radio" name="submissionLevel" value="Value Bulk (1979-Older)" className={styles.largeRadioButton} onChange={handleSubmissionLevelChange} /></div></td>
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
                                    <td><div className={styles.radioContainer}><input type="radio" name="submissionLevel" value="Value Bulk (1980-Present)" className={styles.largeRadioButton} onChange={handleSubmissionLevelChange} /></div></td>
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
                                    <td><div className={styles.radioContainer}><input type="radio" name="submissionLevel" value="Value (1979-Older)" className={styles.largeRadioButton} onChange={handleSubmissionLevelChange} /></div></td>
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
                                    <td><div className={styles.radioContainer}><input type="radio" name="submissionLevel" value="Value (1980-Present)" className={styles.largeRadioButton} onChange={handleSubmissionLevelChange} /></div></td>
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
                                    <td><div className={styles.radioContainer}><input type="radio" name="submissionLevel" value="Value Plus" className={styles.largeRadioButton} onChange={handleSubmissionLevelChange} /></div></td>
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
                                    <td><div className={styles.radioContainer}><input type="radio" name="submissionLevel" value="Regular" className={styles.largeRadioButton} onChange={handleSubmissionLevelChange} /></div></td>
                                    <td>
                                        <div className={styles.headerContainer}>
                                            Regular
                                            <div className={styles.subHeader}>10 Business Days</div>
                                        </div>
                                    </td>
                                    <td>$1500</td>
                                    <td>$73.99</td>
                                </tr>
                                <tr>
                                    <td><div className={styles.radioContainer}><input type="radio" name="submissionLevel" value="Express" className={styles.largeRadioButton} onChange={handleSubmissionLevelChange} /></div></td>
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
                                    <td><div className={styles.radioContainer}><input type="radio" name="submissionLevel" value="Super Express" className={styles.largeRadioButton} onChange={handleSubmissionLevelChange} /></div></td>
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
                        {alertMessage && <div className={styles.alert}>{alertMessage}</div>}
                        <h2>Cards</h2>
                        <table className={styles.cardTable}>
                          <thead>
                            <tr>
                              <th>Year</th>
                              <th>Set</th>
                              <th>Card Number</th>
                              <th>Name</th>
                              <th>Card Type (Variant / Color)</th>
                              <th></th> {/* Column for remove button */}
                            </tr>
                          </thead>
                          <tbody>
                            {cards.map((card, index) => (
                              <tr key={index}>
                                <td><input type="text" value={card.year} onChange={(e) => handleCardChange(index, 'year', e.target.value)} /></td>
                                <td><input type="text" value={card.set} onChange={(e) => handleCardChange(index, 'set', e.target.value)} /></td>
                                <td><input type="text" value={card.number} onChange={(e) => handleCardChange(index, 'number', e.target.value)} /></td>
                                <td><input type="text" value={card.name} onChange={(e) => handleCardChange(index, 'name', e.target.value)} /></td>
                                <td><input type="text" value={card.type} onChange={(e) => handleCardChange(index, 'type', e.target.value)} /></td>
                                <td><button className={styles.removeButton} onClick={() => handleRemoveCard(index)}>Remove</button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className={styles.buttonContainer}>
                          <button className={styles.modalButton} onClick={handleModalOpen}>Submit Card Count Only</button>
                          <button className={styles.addButton} onClick={handleAddCard}>+ Add Card</button>
                        </div>
                        <div className={styles.cardCount}>
                          <p>Total Cards: {cards.length}</p>
                        </div>
                        <div className={styles.buttonContainer}>
                          <button className={styles.navigationButton} onClick={handlePreviousStep}>Previous</button>
                          <button className={styles.navigationButton} onClick={() => {
                            if (cards.length === 0 && !cardCount) {
                              setAlertMessage('Please add at least one card or enter a card count before continuing.');
                            } else {
                              handleNextStep();
                            }
                          }}>Next</button>
                        </div>
                        {isModalOpen && (
                          <div className={styles.modal}>
                            <div className={styles.modalContent}>
                              <h3>Submit Card Count Only</h3>
                              <p>Entering just the card count will incur an additional $2 per card.</p>
                              <input type="number" className={styles.modalInput} value={cardCount} onChange={handleCardCountChange} />
                              <div className={styles.modalButtonContainer}>
                                <button className={styles.modalButton} onClick={handleModalClose}>Close</button>
                                <button className={styles.modalButton} onClick={handleCardCountSubmit}>Submit</button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );                  
            case 3:
                return (
                    <div>
                        {alertMessage && <div className={styles.alert}>{alertMessage}</div>}
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
                        {alertMessage && <div className={styles.alert}>{alertMessage}</div>}
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