import useCart from './UseCart';

const CartSummary = () => {
  const { cart } = useCart();

  const itemCount = cart.length;
  const itemTotalPrice = cart.reduce((total, item) => total + item.price, 0);
  const subtotal = itemTotalPrice + shippingPrice;

  return (
    <div>
      <h2>Summary</h2>
      <p>Number of Packages: {itemCount}</p>
      <p>Number of Items: {itemCount}</p>
      <p>Item Total Price: ${itemTotalPrice.toFixed(2)}</p>
      <p>Shipping Price: ${shippingPrice.toFixed(2)}</p>
      <p>Subtotal: ${subtotal.toFixed(2)}</p>
    </div>
  );
};

export default CartSummary;
