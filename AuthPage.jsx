import React from "react";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { useLocation } from "react-router-dom";

export default function AuthPage() {
  const location = useLocation();
  const isSignUp = location.pathname === "/sign-up";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-black">
      <div className="max-w-md w-full p-4">
        {isSignUp ? (
          <SignUp
            path="/sign-up"
            routing="path"
            signInUrl="/sign-in"
            afterSignUpUrl="/dashboard"
          />
        ) : (
          <SignIn
            path="/sign-in"
            routing="path"
            signUpUrl="/sign-up"
            afterSignInUrl="/dashboard"
          />
        )}
      </div>
    </div>
  );
}
