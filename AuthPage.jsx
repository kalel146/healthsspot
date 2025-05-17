import React from "react";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { useLocation } from "react-router-dom";

export default function AuthPage() {
  const location = useLocation();
  return location.pathname === "/sign-up" ? <SignUp routing="path" path="/sign-up" /> : <SignIn routing="path" path="/sign-in" />;
}
