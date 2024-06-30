import React, { useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import styles from '../../styles/sidepanel/PaymentMethods.module.css';
import Alert from '../../components/Alert/Alert';

const PaymentMethods = () => {
    const { userId, accessToken } = useAuth();
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [newPayment, setNewPayment] = useState({
        cardNumber: '',
        expMonth: '',
        expYear: '',
        cardHolderName: '',
        securityCode: ''
    });
    const [message, setMessage] = useState('');
    const [alertType, setAlertType] = useState('success');
    const [showAlert, setShowAlert] = useState(false);

    useEffect(() => {
        const fetchPaymentMethods = async () => {
            if (!userId) return;

            const response = await fetch(`/api/sidepanel/payment-methods?userId=${userId}`);
            if (response.ok) {
                const data = await response.json();
                setPaymentMethods(data);
            } else {
                console.error('Failed to fetch payment methods');
            }
        };

        fetchPaymentMethods();
    }, [userId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewPayment((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await fetch(`/api/sidepanel/payment-methods?userId=${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ ...newPayment })
        });
        if (response.ok) {
            setMessage('Payment method added successfully');
            setAlertType('success');
            setNewPayment({
                cardNumber: '',
                expMonth: '',
                expYear: '',
                cardHolderName: '',
                securityCode: ''
            });
            const updatedMethods = await fetch(`/api/sidepanel/payment-methods?userId=${userId}`);
            if (updatedMethods.ok) {
                const data = await updatedMethods.json();
                setPaymentMethods(data);
            }
        } else {
            const errorData = await response.json();
            setMessage(`Failed to add payment method: ${errorData.error}`);
            setAlertType('error');
        }
        setShowAlert(true);
    };

    const handleDelete = async (paymentId) => {
        const response = await fetch(`/api/sidepanel/payment-methods?userId=${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ paymentId })
        });

        if (response.ok) {
            setMessage('Payment method deleted successfully');
            setAlertType('success');
            const updatedMethods = await fetch(`/api/sidepanel/payment-methods?userId=${userId}`);
            if (updatedMethods.ok) {
                const data = await updatedMethods.json();
                setPaymentMethods(data);
            }
        } else {
            const errorData = await response.json();
            setMessage(`Failed to delete payment method: ${errorData.error}`);
            setAlertType('error');
        }
        setShowAlert(true);
    };

    return (
        <div className={styles.paymentMethods}>
            <h1>Payment Methods</h1>
            <form onSubmit={handleSubmit} className={styles.paymentForm}>
                <input
                    type="text"
                    name="cardHolderName"
                    placeholder="Card Holder Name"
                    value={newPayment.cardHolderName}
                    onChange={handleChange}
                    required
                />
                <input
                    type="text"
                    name="cardNumber"
                    placeholder="Card Number"
                    value={newPayment.cardNumber}
                    onChange={handleChange}
                    required
                />
                <input
                    type="text"
                    name="expMonth"
                    placeholder="Expiration Month (MM)"
                    value={newPayment.expMonth}
                    onChange={handleChange}
                    required
                />
                <input
                    type="text"
                    name="expYear"
                    placeholder="Expiration Year (YYYY)"
                    value={newPayment.expYear}
                    onChange={handleChange}
                    required
                />
                <input
                    type="text"
                    name="securityCode"
                    placeholder="Security Code"
                    value={newPayment.securityCode}
                    onChange={handleChange}
                    required
                />
                <button type="submit" className={styles.addButton}>Add Payment Method</button>
            </form>
            {showAlert && (
                <Alert
                    message={message}
                    onClose={() => setShowAlert(false)}
                    type={alertType}
                />
            )}
            <h2>Saved Payment Methods</h2>
            <ul className={styles.paymentMethodsList}>
                {paymentMethods.map((method) => (
                    <li key={method.PaymentID} className={styles.paymentMethodItem}>
                        <p>Card Holder: {method.CardHolderName}</p>
                        <p>Card Number: **** **** **** {method.CardNumber.slice(-4)}</p>
                        <p>Expires: {method.ExpMonth}/{method.ExpYear}</p>
                        <p>Security Code: {method.SecurityCode}</p>
                        <button
                            className={styles.deleteButton}
                            onClick={() => handleDelete(method.PaymentID)}
                        >
                            X
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default PaymentMethods;
