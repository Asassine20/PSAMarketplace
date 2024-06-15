import React, { useState, useEffect } from 'react';
import styles from './AddressModal.module.css';
import useAuth from '../../hooks/useAuth';

const states = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const AddressModal = ({ addressType, onClose, onSubmit, setBillingAddress, setShippingAddress }) => {
  const { userId, accessToken } = useAuth();
  const [address, setAddress] = useState({
    FirstName: '',
    LastName: '',
    Street: '',
    Street2: '',
    City: '',
    State: '',
    ZipCode: '',
    Country: '',
  });
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [existingAddresses, setExistingAddresses] = useState([]);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const response = await fetch(`/api/address?userId=${userId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        const data = await response.json();
        setExistingAddresses(data);
      } catch (error) {
        console.error('Failed to fetch addresses:', error);
      }
    };

    fetchAddresses();
  }, [userId, accessToken]);

  useEffect(() => {
    if (selectedAddress) {
      setAddress({
        ...selectedAddress,
        State: selectedAddress.State || '', // Handle missing State value
      });
    }
  }, [selectedAddress]);

  const handleChange = (e) => {
    setAddress({
      ...address,
      [e.target.name]: e.target.value,
    });
  };

  const handleCheckboxChange = (e) => {
    setSameAsBilling(e.target.checked);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (sameAsBilling && setBillingAddress) {
        setBillingAddress(address);
        setShippingAddress(address);
      } else {
        if (addressType === 'billing' && setBillingAddress) {
          setBillingAddress(address);
        } else if (addressType === 'shipping' && setShippingAddress) {
          setShippingAddress(address);
        }
      }
      if (selectedAddress) {
        await onSubmit(selectedAddress, addressType);
      } else {
        const response = await fetch('/api/address', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({ ...address, userId, IsBilling: addressType === 'billing' })
        });
        if (!response.ok) throw new Error('Failed to save address');
        const newAddress = await response.json();
        setExistingAddresses([...existingAddresses, newAddress]);
        await onSubmit(newAddress, addressType);
      }
    } catch (error) {
      console.error('Failed to save address:', error);
    } finally {
      onClose(); // Ensure the modal is closed regardless of success or failure
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalHeader}>Enter {addressType === 'billing' ? 'Billing' : 'Shipping'} Address</h2>
        <form onSubmit={handleSubmit}>
          {existingAddresses.length > 0 && (
            <div className={styles.savedAddresses}>
              <h3>Saved Addresses</h3>
              {existingAddresses.map((addr) => (
                <label key={addr.AddressID} className={styles.addressOption}>
                  <input
                    type="radio"
                    name="savedAddress"
                    value={addr.AddressID}
                    onChange={() => setSelectedAddress(addr)}
                  />
                  <span>
                    {addr.FirstName} {addr.LastName}, {addr.Street}{addr.Street2 && `, ${addr.Street2}`}, {addr.City}, {addr.State}, {addr.ZipCode}, {addr.Country}
                  </span>
                </label>
              ))}
            </div>
          )}
          <h3>New Address</h3>
          <div className={styles.inputGroup}>
            <input
              type="text"
              name="FirstName"
              value={address.FirstName}
              onChange={handleChange}
              placeholder="First Name"
              required={!selectedAddress}
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <input
              type="text"
              name="LastName"
              value={address.LastName}
              onChange={handleChange}
              placeholder="Last Name"
              required={!selectedAddress}
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <input
              type="text"
              name="Street"
              value={address.Street}
              onChange={handleChange}
              placeholder="Street Address"
              required={!selectedAddress}
              className={`${styles.input} ${styles.fullWidthInput}`}
            />
          </div>
          <div className={styles.inputGroup}>
            <input
              type="text"
              name="Street2"
              value={address.Street2}
              onChange={handleChange}
              placeholder="Street Address 2"
              className={`${styles.input} ${styles.fullWidthInput}`}
            />
          </div>
          <div className={styles.inputGroup}>
            <input
              type="text"
              name="City"
              value={address.City}
              onChange={handleChange}
              placeholder="City"
              required={!selectedAddress}
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <select
              name="State"
              value={address.State}
              onChange={handleChange}
              required={!selectedAddress}
              className={styles.input}
            >
              <option value="">Select State</option>
              {states.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
          <div className={styles.inputGroup}>
            <input
              type="text"
              name="ZipCode"
              value={address.ZipCode}
              onChange={handleChange}
              placeholder="Zip Code"
              required={!selectedAddress}
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <input
              type="text"
              name="Country"
              value={address.Country}
              onChange={handleChange}
              placeholder="Country"
              required={!selectedAddress}
              className={styles.input}
            />
          </div>
          {addressType === 'shipping' && (
            <div className={styles.sameAsBillingContainer}>
              <input
                type="checkbox"
                id="sameAsBilling"
                checked={sameAsBilling}
                onChange={handleCheckboxChange}
              />
              <label htmlFor="sameAsBilling">Shipping address is the same as Billing address</label>
            </div>
          )}
          <div className={styles.buttonContainer}>
            <button type="button" className={styles.button} onClick={() => onClose()}>Cancel</button>
            <button type="submit" className={styles.button}>Save Address</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddressModal;
