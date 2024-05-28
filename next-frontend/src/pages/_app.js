import '../styles/globals.css'; // Global styles
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import { CartProvider } from '../components/Cart/CartProvider';
import { useRouter } from 'next/router'; // Import useRouter
import useAuth from '../hooks/useAuth'; // Import useAuth hook
import { useEffect } from 'react'; // Import useEffect

export default function MyApp({ Component, pageProps }) {
  const router = useRouter(); // Use useRouter to get the router object
  const { refreshToken } = useAuth(); // Use useAuth to get the refreshToken function

  // Determine if we should show Navbar and Footer
  const showNavAndFooter = !['/register', '/login'].includes(router.pathname);

  // Optionally, you can refresh the token on initial load
  useEffect(() => {
    refreshToken();
  }, [refreshToken]);

  return (
    <CartProvider>
      {showNavAndFooter && <Navbar />}
      <Component {...pageProps} />
      {showNavAndFooter && <Footer />}
    </CartProvider>
  );
}
