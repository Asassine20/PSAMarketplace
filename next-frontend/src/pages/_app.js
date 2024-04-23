import '../styles/globals.css'; // Global styles
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import { useRouter } from 'next/router'; // Import useRouter

export default function MyApp({ Component, pageProps }) {
  const router = useRouter(); // Use useRouter to get the router object

  // Determine if we should show Navbar and Footer
  const showNavAndFooter = !['/register', '/login'].includes(router.pathname);

  return (
    <>
      {showNavAndFooter && <Navbar />}  
      <Component {...pageProps} />
      {showNavAndFooter && <Footer />}  
    </>
  );
}
