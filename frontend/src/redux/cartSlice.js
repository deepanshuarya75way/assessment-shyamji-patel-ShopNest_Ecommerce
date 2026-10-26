import { createSlice } from '@reduxjs/toolkit';

// User-wise localStorage key
const getCartKey = () => {
  const user = JSON.parse(localStorage.getItem('userInfo')||null);
  return user?._id?`cartItems_&{user._id}`:"cartItems_guest";
};

const loadCartItems = () => {
  try{
    const cart = localStorage.getItem(getCartKey());
    const items=cart ? JSON.parse(cart) : [];

    return Array.isArray(items)?items:[];
  } catch (error){
    console.error("cart loading error:",error);
    return [];
  }    
};

export const mergeGuestCart = async (userData, reduxCart = []) => {
    const userId = userData?._id;
    if (!userId) throw new Error("User ID missing");

    const guestKey = "cartItems_guest";
    const userKey = `cartItems_${userId}`;

    const readCart = (key) => {
      try {
        const items = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(items) ? items : [];
      } catch {
        return [];
      }
    };

    const storedGuestCart = readCart(guestKey);
    const guestCart = storedGuestCart.length > 0? storedGuestCart: !localStorage.getItem("userInfo") && Array.isArray(reduxCart)? reduxCart: [];
    const userCart = readCart(userKey);
    const merged = new Map();
    for (const item of [...userCart, ...guestCart]) {
      if (!item?._id) continue;
      const id = String(item._id);
      const existing = merged.get(id);
      const quantity = Math.max(0,Math.floor(Number(item.qty) || 0));
      const stock = Number(item.stock);
      const limit = Number.isFinite(stock)? Math.max(0, stock):Infinity;
      if (existing) {
        existing.qty = Math.min(existing.qty + quantity,limit);
      } else {
        merged.set(id, {
          ...item,
          qty: Math.min(quantity, limit)});
      }
    }
    const finalCart = [...merged.values()].filter((item) => item.qty > 0);
    localStorage.setItem(userKey,JSON.stringify(finalCart));
    localStorage.removeItem(guestKey);
    return finalCart;
  };
                                                                                                          

const initialState = {
  cartItems: loadCartItems(),
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,

  reducers: {
    // Login/Logout ke baad correct cart load karega
    loadCart: (state) => {
      const items = loadCartItems();
      state.cartItems=Array.isArray(items)?items:[];
    },
    setCartItems:(state,action)=>{
      state.cartItems=action.payload;
    },

    addToCart: (state, action) => {
      const item = action.payload;

      const existItem = state.cartItems.find(
        (x) => x._id === item._id
      );

      if (existItem) {
        state.cartItems = state.cartItems.map((x) =>
          x._id === item._id
            ? {
                ...x,
                qty: item.qty
              }
            : x
        );
      } else {
        state.cartItems.push(item);
      }

      localStorage.setItem(
        getCartKey(),
        JSON.stringify(state.cartItems)
      );
    },

    removeFromCart: (state, action) => {
      state.cartItems = state.cartItems.filter(
        (x) => x._id !== action.payload
      );

      localStorage.setItem(
        getCartKey(),
        JSON.stringify(state.cartItems)
      );
    },

    clearCart: (state) => {
      state.cartItems = [];

      localStorage.setItem(
        getCartKey(),
        JSON.stringify([])
      );
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  clearCart,
  loadCart,
  setCartItems,
} = cartSlice.actions;

export default cartSlice.reducer;