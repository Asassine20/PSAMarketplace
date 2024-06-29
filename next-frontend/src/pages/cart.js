import React, { useEffect, useState } from 'react';
import { useCart } from '../components/Cart/CartProvider';
import styles from '../styles/Cart.module.css';
import Link from 'next/link';
import ImageModal from '../components/ImageModal/ImageModal';
import { useRouter } from 'next/router';

const CartPage = () => {
  const { cart, removeFromCart, clearCart, saveForLater, savedForLater, addToCartFromSaved, removeFromSaved } = useCart();
  const [mounted, setMounted] = useState(false);
  const [modalImages, setModalImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const calculateTotal = () => cart.reduce((total, item) => total + Number(item.price || 0), 0).toFixed(2);

  const calculateShipping = () => {
    const uniqueStores = new Set(cart.map(item => item.storeName));
    const shippingCosts = {};
    cart.forEach(item => {
      if (!shippingCosts[item.storeName]) {
        shippingCosts[item.storeName] = item.shippingPrice;
      }
    });
    return Object.values(shippingCosts).reduce((total, price) => total + Number(price || 0), 0).toFixed(2);
  };

  const groupItemsByStore = (items) => items.reduce((acc, item) => {
    const key = item.storeName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const groupedCartItems = groupItemsByStore(cart);
  const groupedSavedItems = groupItemsByStore(savedForLater);

  const handleImageClick = (images, index) => {
    setModalImages(images);
    setCurrentImageIndex(index);
  };

  const closeModal = () => {
    setModalImages([]);
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  if (!mounted) return null; // Prevent rendering on the server to avoid hydration issues

  return (
    <div className={styles.cartPage}>
      <h1 className={`${styles.largeText} ${styles.leftAlignedTitle}`}>Shopping Cart</h1>
      <div className={styles.cartItemsWrapper}>
        <div className={styles.cartItems}>
          {Object.keys(groupedCartItems).map((storeName) => (
            <div key={storeName} className={styles.package}>
              <h2 className={styles.packageHeader}>
                {storeName} ({groupedCartItems[storeName][0].feedback}%)
              </h2>
              {groupedCartItems[storeName].map((item, index) => (
                <div key={`${item.ListingID}-${index}`} className={styles.cartItem} style={{ borderBottom: index === groupedCartItems[storeName].length - 1 ? 'none' : '1px solid #ccc' }}>
                  <div className={styles.cartItemDetailsTop}>
                    <div className={styles.cartItemDetailsLeft}>
                      <div className={styles.cartItemImages}>
                        <img
                          src={item.imageFront}
                          alt={item.name}
                          className={styles.cartItemImage}
                          onClick={() => handleImageClick([item.imageFront, item.imageBack], 0)}
                        />
                        <img
                          src={item.imageBack}
                          alt={item.name}
                          className={styles.cartItemImage}
                          onClick={() => handleImageClick([item.imageFront, item.imageBack], 1)}
                        />
                      </div>
                    </div>
                    <div className={styles.cartItemDetails}>
                      <Link href={`/cards/${item.cardId}/${item.name}`} className={styles.cartItemDetailsLink}>
                        <p className={styles.largeTextStrong}>
                          {item.name} - {item.sport}
                          {item.cardYear ? ` - ${item.cardYear}` : ''} - {item.cardSet} - #{item.number} - {item.variant} - {item.color}
                        </p>
                      </Link>
                      <p className={styles.largeText}>Grade: {item.grade}</p>
                      <p className={styles.largeText}>
                        <a href={`https://www.psacard.com/cert/${item.certNumber}`} target="_blank" rel="noopener noreferrer">
                          Cert Number: {item.certNumber}
                        </a>
                      </p>
                    </div>
                    <div className={styles.cartItemPrices}>
                      <p className={styles.largeTextStrong}><strong>${(Number(item.price || 0)).toFixed(2)}</strong></p>
                      <p className={`${styles.largeText} ${styles.shippingIncluded}`}>
                        {index === 0 ? `+ ${(Number(item.shippingPrice || 0)).toFixed(2)}` : "Shipping included"}
                      </p>
                    </div>
                  </div>
                  <div className={styles.cartItemActions}>
                    <button className={styles.actionButton} onClick={() => saveForLater(item.ListingID)}>Save for Later</button>
                    <button className={styles.actionButton} onClick={() => removeFromCart(item.ListingID)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          ))}
          {savedForLater.length > 0 && (
            <>
              <h1 className={styles.largeText}>Saved for Later</h1>
              {Object.keys(groupedSavedItems).map((storeName) => (
                <div key={storeName} className={styles.package}>
                  <h2 className={styles.packageHeader}>
                    {storeName} ({groupedSavedItems[storeName][0].feedback}%)
                  </h2>
                  {groupedSavedItems[storeName].map((item, index) => (
                    <div key={`${item.ListingID}-${index}`} className={styles.cartItem} style={{ borderBottom: index === groupedSavedItems[storeName].length - 1 ? 'none' : '1px solid #ccc' }}>
                      <div className={styles.cartItemDetailsTop}>
                        <div className={styles.cartItemDetailsLeft}>
                          <div className={styles.cartItemImages}>
                            <img
                              src={item.imageFront}
                              alt={item.name}
                              className={styles.cartItemImage}
                              onClick={() => handleImageClick([item.imageFront, item.imageBack], 0)}
                            />
                            <img
                              src={item.imageBack}
                              alt={item.name}
                              className={styles.cartItemImage}
                              onClick={() => handleImageClick([item.imageFront, item.imageBack], 1)}
                            />
                          </div>
                        </div>
                        <div className={styles.cartItemDetails}>
                          <Link href={`/cards/${item.cardId}/${item.name}`} className={styles.cartItemDetailsLink}>
                            <p className={styles.largeTextStrong}>
                              {item.name} - {item.sport}
                              {item.cardYear ? ` - ${item.cardYear}` : ''} - {item.cardSet} - #{item.number} - {item.variant} - {item.color}
                            </p>
                          </Link>
                          <p className={styles.largeText}>Grade: {item.grade}</p>
                          <p className={styles.largeText}>
                            <a href={`https://www.psacard.com/cert/${item.certNumber}`} target="_blank" rel="noopener noreferrer">
                              Cert Number: {item.certNumber}
                            </a>
                          </p>
                        </div>
                        <div className={styles.cartItemPrices}>
                          <p className={styles.largeTextStrong}><strong>${(Number(item.price || 0)).toFixed(2)}</strong></p>
                          <p className={`${styles.largeText} ${styles.shippingIncluded}`}>
                            {index === 0 ? `+ ${(Number(item.shippingPrice || 0)).toFixed(2)}` : "Shipping included"}
                          </p>
                        </div>
                      </div>
                      <div className={styles.cartItemActions}>
                        <button className={styles.actionButton} onClick={() => addToCartFromSaved(item.ListingID)}>Move to Cart</button>
                        <button className={styles.actionButton} onClick={() => removeFromSaved(item.ListingID)}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
        <div className={styles.cartSummary}>
          <h2 className={styles.largeText}>Summary</h2>
          <p className={styles.largeText}><span>Packages:</span> <span>{Object.keys(groupedCartItems).length}</span></p>
          <p className={styles.largeText}><span>Items:</span> <span>{cart.length}</span></p>
          <p className={styles.largeText}><span>Item Total:</span> <span>${calculateTotal()}</span></p>
          <p className={styles.largeText}><span>Shipping:</span> <span>${calculateShipping()}</span></p>
          <p className={`${styles.largeText} ${styles.boldText}`}><span>Subtotal:</span> <span>${(parseFloat(calculateTotal()) + parseFloat(calculateShipping())).toFixed(2)}</span></p>
          <button className={styles.clearCartButton} onClick={clearCart}>Clear Cart</button>
          <button className={styles.checkoutButton} onClick={handleCheckout}>Checkout</button>
        </div>
      </div>

      {modalImages.length > 0 && (
        <ImageModal images={modalImages} initialIndex={currentImageIndex} onClose={closeModal} />
      )}
    </div>
  );
};

export default CartPage;
