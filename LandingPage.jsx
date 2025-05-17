import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();
  const [showQuote, setShowQuote] = useState(false);

  const handleOnClick = () => {
    navigate("/dashboard");
  };

  const handleOffClick = () => {
    setShowQuote(true);
    setTimeout(() => setShowQuote(false), 3500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white space-y-8 px-4 text-center">
     <img
  src="/logo.jpg"
  alt="Health's Spot Logo"
  style={{ width: "800px" }}
  className="max-w-full"
/>


     <h1
  className="text-6xl font-extrabold text-transparent bg-clip-text drop-shadow-lg"
  style={{
    backgroundImage: "linear-gradient(to right, #facc15, #f97316, #dc2626, #7f1d1d)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  }}
>
  BEAST MODE
</h1>


      {!showQuote ? (
        <div className="flex space-x-10">
          <button
            onClick={handleOnClick}
            className="bg-green-600 hover:bg-green-700 text-white text-xl font-bold py-3 px-10 rounded"
          >
            ON
          </button>
          <button
            onClick={handleOffClick}
            className="bg-red-600 hover:bg-red-700 text-white text-xl font-bold py-3 px-10 rounded"
          >
            OFF
          </button>
        </div>
      ) : (
        <p className="text-xl text-gray-300 italic max-w-xl">
          "Rest day. The most powerful day. Enjoy life to the fullest."
        </p>
      )}
    </div>
  );
}
