import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { registerUser } from "../services/auth.ts";
import Logo from "../components/Logo";
import TextInput from "../components/TextInput";
import PrimaryButton from "../components/PrimaryButton";
import AuthCard from "../components/AuthCard";

export default function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [location, setLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !email || !password || !contactNumber || !location) {
      alert("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      const obj = {
        username,
        email,
        password,
        contactNumber,
        location
      };

      const res: any = await registerUser(obj);
      alert(`Registration Successful! Email: ${res?.data?.email}`);
      navigate("/login");
    } catch (err: any) {
      console.error("Registration failed:", err);
      alert(`Registration failed: ${err?.response?.data?.message || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-orange-50 flex items-center justify-center p-6">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="hidden md:flex flex-col items-start justify-center gap-6">
          <Logo />
          <h1 className="text-4xl font-extrabold text-orange-500">Welcome to AdoptSmart</h1>
          <p className="text-gray-600">Join our community to give pets a loving home. Create an account to start adopting or listing pets for adoption.</p>
          <div className="mt-4 p-6 rounded-lg bg-white shadow-sm">
            <div className="text-lg font-semibold text-orange-500">Why Adopt?</div>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
              <li>Find loving pets near you</li>
              <li>Easy, safe adoption flow</li>
              <li>Support animal welfare</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <AuthCard title="Create an account" subtitle="Register to AdoptSmart — connect with pets and adopters">
            <form onSubmit={handleSubmit} className="space-y-3">
              <TextInput label="Username" placeholder="Your name or handle" value={username} onChange={setUsername} required />
              <TextInput label="Email" type="email" placeholder="you@example.com" value={email} onChange={setEmail} required />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <TextInput label="Password" type="password" placeholder="Password" value={password} onChange={setPassword} required />
                <TextInput label="Confirm Password" type="password" placeholder="Confirm password" value={confirmPassword} onChange={setConfirmPassword} required />
              </div>
              <TextInput label="Contact Number" placeholder="+1 555 555 555" value={contactNumber} onChange={setContactNumber} required />
              <TextInput label="Location" placeholder="City, Country" value={location} onChange={setLocation} required />

              <PrimaryButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Registering..." : "Create account"}
              </PrimaryButton>

              <div className="text-sm text-center text-gray-600">
                Already have an account? <Link to="/login" className="text-orange-500 font-medium">Sign in</Link>
              </div>
            </form>
          </AuthCard>
        </div>
      </div>
    </div>
  );
}
