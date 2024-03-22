// pages/_app.js
import '../styles/globals.css'; // Global styles
import Navbar from '../components/Navbar/Navbar';

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Navbar />
      <Component {...pageProps} />
    </>
  );
}
