import React, { useState, createContext } from 'react';
import { useDispatch,useSelector } from 'react-redux';
import { mergeGuestCart, setCartItems, loadCart } from '../redux/cartSlice';



export const AuthContext = createContext();




export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("userInfo")) || null
  );

  const login = async(userData) => {
    if(!userData?._id){
      throw new Error('Invalid user data');
    }
    const guestKey="cartItems_guest";
    const userKey=`cartItems_${userData._id}`;
    console.log("Guest cart before login:",localStorage.getItem(guestKey));
    const mergedCart=await mergeGuestCart(userData);
    console.log("user cart after merge:",localStorage.getItem(userKey));
    localStorage.setItem(
      'userInfo',
      JSON.stringify(userData)
    );
    
    setUser(userData);
    
    dispatch(setCartItems(mergedCart));
    

  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("userInfo");

    // Guest cart load karo
    dispatch(loadCart());
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};