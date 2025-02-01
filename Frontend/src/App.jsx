import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import UserSignUp from "./pages/UserSignUp";
import VerificationCode from "./pages/VerificationCode";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgetPass";
import CreateNewPassword from "./pages/NewPass";
import Index from "./components/Index";
import Home from "./pages/Home";
import AboutUs from "./pages/AboutUs";
import SellerSignUp from "./pages/SellerSignUp";
import ChefSignUp from "./pages/ChefSignUp";
import ProfilePage from "./pages/UpdateUser";
import SellerVerificationCode from "./pages/SellerVerificationCode";
import Dashboard from "./pages/Vendor/Dahboard";
import SellerUpdatePage from "./pages/Vendor/UpdateSeller"
import ProductPage from "./pages/Vendor/Product";
import AddProduct from "./pages/Vendor/AddProduct";

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
  <Route path="/" element={<Index />} />
  <Route path="/home" element={<Home />} />
  <Route path="/aboutus" element={<AboutUs />} />
  <Route path="/userProfile" element={<ProfilePage />} />
  <Route path="/SellerVerificationCode" element={<SellerVerificationCode />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/sellerprofile" element={<SellerUpdatePage />} />
  <Route path='/product' element ={<ProductPage/>}/>
  <Route path='/addproduct' element ={<AddProduct/>}/>
</Routes>
  );
}

export default App;
