import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../styles/Register.module.css'; // Reuse the Register styles

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState(''); // State for error message
  const router = useRouter();
  const { redirect } = router.query; // Get the redirect query parameter

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage(''); // Clear any previous error messages
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('isLoggedIn', 'true'); // Set logged-in flag

        // Redirect to the specified page or home page
        router.push(redirect || '/').then(() => {
          // Refresh the page after redirection
          window.location.reload();
        });
      } else {
        setErrorMessage(data.message); // Set the error message
      }
    } catch (error) {
      console.error('An unexpected error occurred:', error);
      setErrorMessage('An unexpected error occurred. Please try again later.');
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Login</title>
        <meta name="description" content="Log in to your account" />
      </Head>
      <Link href="/"><Image src="/logo.png" alt="Home" width={60} height={60} className={styles.logo} /></Link>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h1 className={styles.header}>Log In</h1>
        {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>} {/* Ensure same class name */}
        <label htmlFor="email" className={styles.label}>Email</label>
        <input type="email" id="email" name="email" value={email}
               onChange={(e) => setEmail(e.target.value)} required className={styles.input} />
        <label htmlFor="password" className={styles.label}>Password</label>
        <input type="password" id="password" name="password" value={password}
               onChange={(e) => setPassword(e.target.value)} required className={styles.input} />
        <button type="submit" className={styles.button}>Log In</button>
        <p>Don't have an account? <Link href="/register">Sign up here</Link></p>
      </form>
    </div>
  );
}
