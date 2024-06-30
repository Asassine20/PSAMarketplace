import React, { useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import styles from '../../styles/sidepanel/Addresses.module.css';
import Alert from '../../components/Alert/Alert';
import { FaTrash } from "react-icons/fa6";

const states = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const Addresses = () => {
  const { userId, accessToken } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState({
    FirstName: '',
    LastName: '',
    Street: '',
    Street2: '',
    City: '',
    State: '',
    ZipCode: '',
    Country: '',
    IsPrimary: false,
  });
  const [message, setMessage] = useState('');
  const [alertType, setAlertType] = useState('success');

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!userId) return;

      const response = await fetch(`/api/sidepanel/addresses?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        const sortedAddresses = data.sort((a, b) => b.IsPrimary - a.IsPrimary);
        setAddresses(sortedAddresses);
      } else {
        console.error('Failed to fetch addresses');
      }
    };

    fetchAddresses();
  }, [userId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAddress((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch('/api/sidepanel/addresses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ ...newAddress, userId }),
    });

    if (response.ok) {
      const newAddress = await response.json();
      setAddresses((prev) => [newAddress, ...prev]);
      setMessage('Address added successfully');
      setAlertType('success');
      setNewAddress({
        FirstName: '',
        LastName: '',
        Street: '',
        Street2: '',
        City: '',
        State: '',
        ZipCode: '',
        Country: '',
        IsPrimary: false,
      });
    } else {
      const errorData = await response.json();
      setMessage(`Failed to add address: ${errorData.message}`);
      setAlertType('error');
    }
  };

  const handleDelete = async (id) => {
    const response = await fetch(`/api/sidepanel/addresses?userId=${userId}&addressId=${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.ok) {
      setAddresses((prev) => prev.filter((address) => address.AddressID !== id));
      setMessage('Address deleted successfully');
      setAlertType('success');
    } else {
      setMessage('Failed to delete address');
      setAlertType('error');
    }
  };

  const handleSetPrimary = async (id) => {
    const response = await fetch(`/api/sidepanel/addresses/primary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ userId, addressId: id }),
    });

    if (response.ok) {
      const updatedAddresses = await response.json();
      const sortedAddresses = updatedAddresses.sort((a, b) => b.IsPrimary - a.IsPrimary);
      setAddresses(sortedAddresses);
      setMessage('Primary address updated successfully');
      setAlertType('success');
    } else {
      setMessage('Failed to update primary address');
      setAlertType('error');
    }
  };

  return (
    <div className={styles.addresses}>
      <h1>Addresses</h1>
      <form onSubmit={handleSubmit} className={styles.addressForm}>
        <label className={styles.requiredLabel}>First Name *</label>
        <input
          type="text"
          name="FirstName"
          placeholder="First Name"
          value={newAddress.FirstName}
          onChange={handleChange}
          required
        />
        <label className={styles.requiredLabel}>Last Name *</label>
        <input
          type="text"
          name="LastName"
          placeholder="Last Name"
          value={newAddress.LastName}
          onChange={handleChange}
          required
        />
        <label className={styles.requiredLabel}>Street Address *</label>
        <input
          type="text"
          name="Street"
          placeholder="Street Address"
          value={newAddress.Street}
          onChange={handleChange}
          required
        />
        <label className={styles.requiredLabel}>Apartment, Unit, etc.</label>
        <input
          type="text"
          name="Street2"
          placeholder="Street Address 2"
          value={newAddress.Street2}
          onChange={handleChange}
        />
        <label className={styles.requiredLabel}>City *</label>
        <input
          type="text"
          name="City"
          placeholder="City"
          value={newAddress.City}
          onChange={handleChange}
          required
        />
        <label className={styles.requiredLabel}>State *</label>
        <select
          name="State"
          value={newAddress.State}
          onChange={handleChange}
          required
        >
          <option value="">Select State</option>
          {states.map((state) => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
        <label className={styles.requiredLabel}>Zip Code *</label>
        <input
          type="text"
          name="ZipCode"
          placeholder="Zip Code"
          value={newAddress.ZipCode}
          onChange={handleChange}
          required
        />
        <label className={styles.requiredLabel}>Country *</label>
        <input
          type="text"
          name="Country"
          placeholder="Country"
          value={newAddress.Country}
          onChange={handleChange}
          required
        />
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="IsPrimary"
              checked={newAddress.IsPrimary}
              onChange={handleChange}
              className={styles.checkbox}
            />
            Primary
          </label>
        </div>
        <button type="submit" className={styles.addButton}>Add Address</button>
      </form>
      {message && <Alert message={message} onClose={() => setMessage('')} type={alertType} />}
      <h2>Saved Addresses</h2>
      <ul className={styles.addressList}>
        {addresses.map((address) => (
          <li
            key={address.AddressID}
            className={`${styles.addressItem} ${address.IsPrimary ? styles.primaryAddress : ''}`}
          >
            {address.IsPrimary && <div className={styles.primaryBubble}>Primary</div>}
            <p>{address.FirstName} {address.LastName}</p>
            <p>{address.Street} {address.Street2}</p>
            <p>{address.City}, {address.State} {address.ZipCode}</p>
            <p>{address.Country}</p>
            <button
              className={styles.deleteButton}
              onClick={() => handleDelete(address.AddressID)}
            >
              <FaTrash />
            </button>
            {!address.IsPrimary && (
              <button
                className={styles.setPrimaryButton}
                onClick={() => handleSetPrimary(address.AddressID)}
              >
                Set as Primary
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Addresses;
