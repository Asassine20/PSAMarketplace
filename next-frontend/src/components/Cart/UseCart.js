import { useContext } from 'react';
import CartContext from './CartContext';

const useCart = () => {
  return useContext(CartContext);
};

export default useCart;
