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
    const router = useRouter();

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
        if (!agreeToTerms) {
            alert("You must agree to the terms of service.");
            return;
        }
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                  email, 
                  password, 
                  passwordConfirm: confirmPassword,  // Make sure this line correctly passes the confirmPassword state
                }),
              });                        
            const data = await response.json();
            if (data.message === 'User Created Successfully') {
                alert('Registration successful');
                router.push('/login');  // Redirect to login page
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            console.error('An unexpected error occurred:', error);
            alert('Error: ' + error.message);
        }
    }

    return (
        <div className={styles.container}>
            <Head>
                <title>Register</title>
                <meta name="description" content="Sign up for a new account" />
            </Head>
            <Link href="/"><Image src="/logo.png" alt="Home" width={60} height={60} /></Link>
            <form onSubmit={handleSubmit} className={styles.form}>
                <h1 className={styles.header}>Create Account</h1>
                <label htmlFor="email" className={styles.label}>Email</label>
                <input type="email" id="email" name="email" value={email}
                       onChange={(e) => setEmail(e.target.value)} required className={styles.input}/>
                <label htmlFor="password" className={styles.label}>Password</label>
                <input type="password" id="password" name="password" value={password}
                       onChange={(e) => setPassword(e.target.value)} required className={styles.input}/>
                <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
                <input type="password" id="confirmPassword" name="confirmPassword" value={confirmPassword}
                       onChange={(e) => setConfirmPassword(e.target.value)} required className={styles.input}/>
                <label>
                    <input type="checkbox" checked={agreeToTerms} onChange={(e) => setAgreeToTerms(e.target.checked)} />
                    I agree to the terms of service
                </label>
                <button type="submit" className={styles.button}>Register</button>
                <p>Already have an account? <Link href="/login">Log in here</Link></p>
            </form>
        </div>
    );
}
