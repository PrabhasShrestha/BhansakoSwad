import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import UserSignUp from "./pages/UserSignUp";
import VerificationCode from "./pages/VerificationCode";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgetPass";
import CreateNewPassword from "./pages/NewPass";

function App() {
  return (
<Routes>
  <Route path="/" element={<UserSignUp />} />
  <Route path="/verify" element={<VerificationCode />} />
  <Route path="/login" element={<Login />} />
  <Route path="/ForgotPass" element={<ForgotPassword />} />
  <Route path="/NewPass" element={<CreateNewPassword />} />
</Routes>
  );
}

export default App;
