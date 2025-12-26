import React from "react";

export default function AuthCard({ children, title, subtitle }: { children: React.ReactNode; title?: string; subtitle?: string }) {
  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
      {title && <h2 className="text-2xl font-bold text-gray-800">{title}</h2>}
      {subtitle && <p className="text-sm text-gray-500 mt-1 mb-6">{subtitle}</p>}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

