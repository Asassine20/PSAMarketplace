import useCart from './UseCart';

const CartItem = ({ item }) => {
  const { removeFromCart } = useCart();

  return (
    <div>
      <h2>{item.name}</h2>
      <p>Price: ${item.price}</p>
      <button onClick={() => removeFromCart(item.id)}>Remove</button>
    </div>
  );
};

export default CartItem;
