import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import UserSignUp from "./pages/User/UserSignUp";
import VerificationCode from "./pages/User/VerificationCode";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgetPass";
import CreateNewPassword from "./pages/NewPass";
import Index from "./components/Index";
import Home from "./pages/Home";
import AboutUs from "./pages/User/AboutUs";
import SellerSignUp from "./pages/SellerSignUp";
import ChefSignUp from "./pages/ChefSignUp";
import ProfilePage from "./pages/User/UpdateUser";
import SellerVerificationCode from "./pages/SellerVerificationCode";
import Dashboard from "./pages/Vendor/Dahboard";
import SellerUpdatePage from "./pages/Vendor/UpdateSeller"
import ProductPage from "./pages/Vendor/Product";
import StoreListing from "./pages/User/Store";
import StoreDetails from "./pages/User/StoreDetails";
import ProductDetails from "./pages/User/ProductDetails";
import ShoppingCart from "./pages/User/Carts";
import CreateNewSellerPassword from "./pages/Vendor/NewPassword";
import TotalPayement from "./pages/User/Payement";
import SuccessPage from "./pages/User/SuccessPage";
import OrderPage from "./pages/Vendor/Orders";

function App() {
  return (
<Routes>
  <Route path="/signUp" element={<UserSignUp />} />
  <Route path="/sellersignUp" element={<SellerSignUp />} />
  <Route path="/chefsignUp" element={<ChefSignUp />} />
  <Route path="/verify" element={<VerificationCode />} />
  <Route path="/login" element={<Login />} />
  <Route path="/ForgotPass" element={<ForgotPassword />} />
  <Route path="/NewPass" element={<CreateNewPassword />} />
  <Route path="/NewSellerPass" element={<CreateNewSellerPassword />} />
  <Route path="/" element={<Index />} />
  <Route path="/home" element={<Home />} />
  <Route path="/aboutus" element={<AboutUs />} />
  <Route path="/userProfile" element={<ProfilePage />} />
  <Route path="/SellerVerificationCode" element={<SellerVerificationCode />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/sellerprofile" element={<SellerUpdatePage />} />
  <Route path='/product' element ={<ProductPage/>}/>
  <Route path='/order' element ={<OrderPage/>}/>
  <Route path='/store' element ={<StoreListing/>}/>
  <Route path='/store/:id' element ={<StoreDetails/>}/>
  <Route path="/product/:id" element={<ProductDetails />}/>
  <Route path="/shoppingcart" element={<ShoppingCart />}/>
  <Route path="/orderdetails" element={<TotalPayement />}/>
  <Route path="/success" element={<SuccessPage />}/>
</Routes>
  );
}

export default App;
