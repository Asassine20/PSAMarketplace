import useCart from './UseCart';
import CartItem from './CartItem';
import CartSummary from './CartSummary';

const Cart = () => {
  const { cart, clearCart } = useCart();

  return (
    <div>
      <h1>Shopping Cart</h1>
      {cart.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          <div>
            {cart.map(item => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>
          <CartSummary />
          <button onClick={clearCart}>Clear Cart</button>
        </>
      )}
    </div>
  );
};

export default Cart;
