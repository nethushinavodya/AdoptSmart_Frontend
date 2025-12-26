import React from "react";

export default function PrimaryButton({ children, type = "button", disabled = false }: { children: React.ReactNode; type?: "button" | "submit" | "reset"; disabled?: boolean }) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`w-full px-4 py-2 rounded-lg text-white font-semibold transition ${disabled ? "bg-orange-200" : "bg-orange-500 hover:bg-orange-600"}`}
    >
      {children}
    </button>
  );
}

