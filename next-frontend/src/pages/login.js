import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Login.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();
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
        alert('Login successful');
        router.push('/');
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('An unexpected error occurred:', error);
      alert('Error: ' + error.message);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Login</title>
        <meta name="description" content="Log in to your account" />
      </Head>
      <Link href="/">Home</Link>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h1 className={styles.header}>Log In</h1>
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
