// pages/_app.js
import '../styles/globals.css'; // Global styles
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Navbar />
      <Component {...pageProps} />
      <Footer />
    </>
  );
}
