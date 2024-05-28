import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../styles/Register.module.css';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const router = useRouter();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage(''); // Clear any previous error messages
        setSuccessMessage(''); // Clear any previous success messages

        if (password !== confirmPassword) {
            setErrorMessage("Passwords do not match!");
            return;
        }
        if (!agreeToTerms) {
            setErrorMessage("You must agree to the terms of service.");
            return;
        }
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                  email, 
                  password, 
                  passwordConfirm: confirmPassword,
                }),
              });                        
            const data = await response.json();
            if (response.ok) {
                setSuccessMessage('Registration successful');
                setTimeout(() => {
                    router.push('/login');  // Redirect to login page after a delay
                }, 2000);
            } else {
                setErrorMessage('Error: ' + data.message);
            }
        } catch (error) {
            console.error('An unexpected error occurred:', error);
            setErrorMessage('Error: ' + error.message);
        }
    }

    return (
        <div className={styles.container}>
            <Head>
                <title>Register</title>
                <meta name="description" content="Sign up for a new account" />
            </Head>
            <Link href="/"><Image src="/logo.png" alt="Home" width={60} height={60} className={styles.logo} /></Link>
            <form onSubmit={handleSubmit} className={styles.form}>
                <h1 className={styles.header}>Create Account</h1>
                {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}
                {successMessage && <div className={styles.successAlert}>{successMessage}</div>}
                <label htmlFor="email" className={styles.label}>Email</label>
                <input type="email" id="email" name="email" value={email}
                       onChange={(e) => setEmail(e.target.value)} required className={styles.input}/>
                <label htmlFor="password" className={styles.label}>Password</label>
                <input type="password" id="password" name="password" value={password}
                       onChange={(e) => setPassword(e.target.value)} required className={styles.input}/>
                <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
                <input type="password" id="confirmPassword" name="confirmPassword" value={confirmPassword}
                       onChange={(e) => setConfirmPassword(e.target.value)} required className={styles.input}/>
                <label className={styles.checkboxLabel}>
                    <input type="checkbox" checked={agreeToTerms} onChange={(e) => setAgreeToTerms(e.target.checked)} />
                    I agree to the terms of service
                </label>
                <button type="submit" className={styles.button}>Register</button>
                <p>Already have an account? <Link href="/login">Log in here</Link></p>
            </form>
        </div>
    );
}
