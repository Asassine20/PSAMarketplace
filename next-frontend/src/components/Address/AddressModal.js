import React, { useState, useEffect } from 'react';
import styles from './AddressModal.module.css';

const states = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const AddressModal = ({ addressType, onClose, onSubmit, existingAddresses, setBillingAddress }) => {
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

  useEffect(() => {
    if (selectedAddress) {
      setAddress({
        ...selectedAddress,
        State: selectedAddress.State || '', // Handle missing State value
      });
    }
  }, [selectedAddress]);

  useEffect(() => {
    if (sameAsBilling && setBillingAddress) {
      setBillingAddress(address);
      onClose();
    }
  }, [sameAsBilling, address, onClose, setBillingAddress]);

  const handleChange = (e) => {
    setAddress({
      ...address,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedAddress) {
        await onSubmit(selectedAddress, addressType);
      } else {
        await onSubmit(address, addressType);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save address:', error);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalHeader}>Enter {addressType === 'billing' ? 'Billing' : 'Shipping'} Address</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.savedAddresses}>
            {existingAddresses.map((addr) => (
              <label key={addr.AddressID} className={styles.addressOption}>
                <input
                  type="radio"
                  name="savedAddress"
                  value={addr.AddressID}
                  onChange={() => setSelectedAddress(addr)}
                />
                <span>
                  {addr.FirstName} {addr.LastName}<br />
                  {addr.Street}{addr.Street2 && <>, {addr.Street2}</>}<br />
                  {addr.City}, {addr.State}, {addr.ZipCode}<br />
                  {addr.Country}
                </span>
              </label>
            ))}
          </div>
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
                onChange={(e) => setSameAsBilling(e.target.checked)}
              />
              <label htmlFor="sameAsBilling">Shipping address is the same as Billing address</label>
            </div>
          )}
          <div className={styles.buttonContainer}>
            <button type="button" className={styles.button} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.button}>Save Address</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddressModal;
