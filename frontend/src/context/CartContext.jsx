import React, { createContext, useContext, useReducer, useCallback } from 'react';

const CartContext = createContext(null);

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.findIndex(
        (i) => i.sku === action.payload.sku && i.product_name === action.payload.product_name
      );
      if (existing >= 0) {
        const updated = [...state.items];
        updated[existing] = {
          ...updated[existing],
          quantity: updated[existing].quantity + 1,
        };
        return { ...state, items: updated };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }],
      };
    }
    case 'INCREASE': {
      return {
        ...state,
        items: state.items.map((item) =>
          item.sku === action.payload
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      };
    }
    case 'DECREASE': {
      return {
        ...state,
        items: state.items
          .map((item) =>
            item.sku === action.payload
              ? { ...item, quantity: item.quantity - 1 }
              : item
          )
          .filter((item) => item.quantity > 0),
      };
    }
    case 'REMOVE': {
      return {
        ...state,
        items: state.items.filter((item) => item.sku !== action.payload),
      };
    }
    case 'CLEAR': {
      return { ...state, items: [] };
    }
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  const addItem = useCallback((product) => {
    dispatch({ type: 'ADD_ITEM', payload: product });
  }, []);

  const increaseQty = useCallback((sku) => {
    dispatch({ type: 'INCREASE', payload: sku });
  }, []);

  const decreaseQty = useCallback((sku) => {
    dispatch({ type: 'DECREASE', payload: sku });
  }, []);

  const removeItem = useCallback((sku) => {
    dispatch({ type: 'REMOVE', payload: sku });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  const subtotal = state.items.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  );

  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        subtotal,
        itemCount,
        addItem,
        increaseQty,
        decreaseQty,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};
