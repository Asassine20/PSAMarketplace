// src/components/Address/AddressModal.js
import React, { useState } from 'react';
import styles from './AddressModal.module.css';

const AddressModal = ({ addressType, onClose, onSubmit }) => {
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

  const handleChange = (e) => {
    setAddress({
      ...address,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(address, addressType);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Enter {addressType === 'billing' ? 'Billing' : 'Shipping'} Address</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="FirstName"
            value={address.FirstName}
            onChange={handleChange}
            placeholder="First Name"
            required
          />
          <input
            type="text"
            name="LastName"
            value={address.LastName}
            onChange={handleChange}
            placeholder="Last Name"
            required
          />
          <input
            type="text"
            name="Street"
            value={address.Street}
            onChange={handleChange}
            placeholder="Street Address"
            required
          />
          <input
            type="text"
            name="Street2"
            value={address.Street2}
            onChange={handleChange}
            placeholder="Street Address 2"
          />
          <input
            type="text"
            name="City"
            value={address.City}
            onChange={handleChange}
            placeholder="City"
            required
          />
          <input
            type="text"
            name="State"
            value={address.State}
            onChange={handleChange}
            placeholder="State"
            required
          />
          <input
            type="text"
            name="ZipCode"
            value={address.ZipCode}
            onChange={handleChange}
            placeholder="Zip Code"
            required
          />
          <input
            type="text"
            name="Country"
            value={address.Country}
            onChange={handleChange}
            placeholder="Country"
            required
          />
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
