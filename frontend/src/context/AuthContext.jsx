import React, { useState, createContext } from 'react';
import { useDispatch } from 'react-redux';
import { loadCart } from '../redux/cartSlice';



export const AuthContext = createContext();


const mergeGuestCart=async(userData)=>{
  const guestKey='cartItems_guest';
  const userKey=`cartItems_${userData._id}`;
  const guestCart=JSON.parse(localStorage.getItem(guestKey)||'[]');
  if (guestCart.length===0) return;
  const userCart=JSON.parse(localStorage.getItem(userKey)||'[]');
  const merged=new Map();
  for (const item of [...userCart,...guestCart]){
    if(!item._id) continue;
    const id=String(item._id);
    const existing =merged.get(id);
    const qty=Math.max(0,Math.floor(Number(item.qty)||0));
    if(existing){
      existing.qty+=qty;

    }else{
      merged.set(id,{...item,qty});
    }
  }
  const finalCart=[];
  for(const item of merged.values()){
    const response=await fetch(`/api/products/${item._id}`);
    if(response.status===404) continue;
    if(!response.ok){
      throw new Error('Unable to check product stock');
    }
    const product=await response.json();
    const stock=Math.max(0,Number(product.stock)||0);
    const qty=Math.min(item.qty7,stock);
    if(qty>0){
      finalCart.push({
        _id:product._id,
        name:product.name,
        price:product.price,
        imageUrl:product.imageUrl,
        stock,
        qty
      });
    }
  }
  localStorage.setItem(userKey,JSON.stringify(finalCart));
  localStorage.removeItem(guestKey);;
}

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
    await mergeGuestCart(userData);
    console.log("user cart after merge:",localStorage.getItem(userKey));
    localStorage.setItem(
      'userInfo',
      JSON.stringify(userData)
    );
    
    setUser(userData);
    const mergedCart=JSON.parse(localStorage.getItem(`cartItems_${userData._id}`)||"[]");
    dispatch(loadCart());
    console.log("Merged cart:",mergedCart);

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