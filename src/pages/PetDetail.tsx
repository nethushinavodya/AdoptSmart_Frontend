import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "../components/button";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Heart,
  Phone,
  Mail,
  User,
  X,
  Send,
  PawPrint,
  Home as HomeIcon,
  Search,
  Star,
  LogOut,
  Menu,
  CheckCircle,
  DollarSign,
} from "lucide-react";
import { getPetPostById, contactPostOwner } from "../services/petPost";
import { useAuth } from "../context/authContext";
import Footer from "../components/Footer";
import { isFavorite, toggleFavorite as apiToggleFavorite } from "../services/favorite";

interface PetOwner {
  _id: string;
  username: string;
  email?: string;
  profilePicture?: string | null;
  contactNumber?: string;
  location?: string;
}

type AgeUnit = "Months" | "Years";

interface PetAge {
  value: number;
  unit: AgeUnit;
}

interface Pet {
  _id: string;
  ownerId: PetOwner;
  name: string;
  species: string;
  breed: string;
  age: PetAge | number | string;
  gender: string;
  description: string;
  imageUrl: string;
  adoptionType: "Free" | "Paid";
  price?: number;
  contactInfo?: string;
  location: string;
  status: "Available" | "Adopted" | "Pending";
  createdAt?: string;
  updatedAt?: string;
}

const PetDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [emailData, setEmailData] = useState({
    email: user?.email || "",
    message: "",
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [mailStatus, setMailStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [favorited, setFavorited] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const toastTimerMs = 2000;

  useEffect(() => {
    fetchPetDetail();
  }, [id]);

  useEffect(() => {
    const run = async () => {
      if (!user || !id) {
        setFavorited(false);
        return;
      }
      try {
        const r = await isFavorite(id);
        setFavorited(Boolean(r.favorited));
      } catch {
        setFavorited(false);
      }
    };
    run();
  }, [user, id]);

  const fetchPetDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const petData = await getPetPostById(id);
      setPet(petData);
    } catch (error) {
      console.error("Error fetching pet details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const getUserInitials = () => {
    if (!user?.username) return "U";
    return user.username
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAdoptClick = () => {
    if (!user) {
      navigate("/login", { replace: true, state: { from: `/pets/${id}` } });
      return;
    }

    setMailStatus(null);
    setShowAdoptModal(true);

    setEmailData((prev) => ({
      ...prev,
      email: user?.email || "",
      message: `Hi! I'm interested in adopting ${pet?.name}. I would love to learn more about this adorable pet and discuss the adoption process.`,
    }));
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!user) {
      setShowAdoptModal(false);
      navigate("/login", { replace: true, state: { from: `/pets/${id}` } });
      return;
    }

    const msg = emailData.message?.trim();
    if (!msg) {
      setMailStatus({ type: "error", text: "Message is required" });
      return;
    }

    setSendingEmail(true);
    setMailStatus(null);

    try {
      const resp = await contactPostOwner(id, msg);

      setMailStatus({
        type: "success",
        text: resp?.message || "Email sent successfully",
      });

      window.setTimeout(() => {
        setShowAdoptModal(false);
        setEmailData({ email: user?.email || "", message: "" });
        setMailStatus(null);
      }, 900);
    } catch (err: any) {
      const status = err?.response?.status;
      const apiMsg = err?.response?.data?.message;

      if (status === 401) {
        setShowAdoptModal(false);
        navigate("/login", { replace: true, state: { from: `/pets/${id}` } });
        return;
      }

      setMailStatus({
        type: "error",
        text: apiMsg || err?.message || "Failed to send email",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!id) return;

    if (!user) {
      navigate("/login", { replace: true, state: { from: `/pets/${id}` } });
      return;
    }
    if (favoriteBusy) return;

    const next = !favorited;
    setFavoriteBusy(true);
    setFavorited(next); // optimistic

    try {
      await apiToggleFavorite(id, next);
      setToast({ type: "success", text: next ? "Added to favorites" : "Removed from favorites" });
      window.setTimeout(() => setToast(null), toastTimerMs);
    } catch (e) {
      setFavorited(!next); // rollback
      setToast({ type: "error", text: "Favorite update failed" });
      window.setTimeout(() => setToast(null), toastTimerMs);
      console.error("Favorite toggle failed:", e);
    } finally {
      setFavoriteBusy(false);
    }
  };

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return "Just now";

    const now = new Date();
    const posted = new Date(dateString);
    const diffInMs = now.getTime() - posted.getTime();
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInDays < 1) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const capitalize = (str: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const formatAge = (age: PetAge | number | string) => {
    if (!age && age !== 0) return "Unknown";

    if (typeof age === "number") {
      return age === 1 ? "1 Year" : `${age} Years`;
    }

    if (typeof age === "string") {
      try {
        const parsed = JSON.parse(age) as PetAge;
        if (parsed && typeof parsed.value === "number") {
          const unit =
            parsed.unit === "Months" || parsed.unit === "Years"
              ? parsed.unit
              : "Years";
          return `${parsed.value} ${
            parsed.value === 1 ? unit.slice(0, -1) : unit
          }`;
        }
      } catch {
        return age;
      }
      return age;
    }

    const unit =
      age.unit === "Months" || age.unit === "Years" ? age.unit : "Years";
    return `${age.value} ${
      age.value === 1 ? unit.slice(0, -1) : unit
    }`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-dashed rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading pet details...</p>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-white">
        <div className="text-center">
          <PawPrint className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Pet not found</h2>
          <p className="text-gray-600 mb-6">The pet you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/pets")} className="bg-orange-500 hover:bg-orange-600 text-white">
            Browse Pets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      <nav className="sticky top-0 z-50 bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                   className="drop-shadow">
                <path d="M12 13c-2.5 0-4.5 1.5-4.5 3.5S9.5 20 12 20s4.5-1.5 4.5-3.5S14.5 13 12 13z" fill="#FB923C"/>
                <path d="M6.2 8.7c.9-.9 2.6-1.1 3.6-.4.9.7 1.2 2 .3 2.9-.9.9-2.6 1.1-3.6.4-.9-.7-1.2-2-.3-2.9z"
                      fill="#FB923C"/>
                <path d="M17.8 8.7c-.9-.9-2.6-1.1-3.6-.4-.9.7-1.2 2-.3 2.9.9.9 2.6 1.1 3.6.4.9-.7 1.2-2 .3-2.9z"
                      fill="#FB923C"/>
                <path d="M8.2 4.6c.6-.8 1.9-1.1 2.8-.6.9.5 1.3 1.6.7 2.4-.6.8-1.9 1.1-2.8.6-.9-.5-1.3-1.6-.7-2.4z"
                      fill="#FB923C"/>
                <path d="M15.8 4.6c-.6-.8-1.9-1.1-2.8-.6-.9.5-1.3 1.6-.7 2.4.6.8 1.9 1.1 2.8.6.9-.5 1.3-1.6.7-2.4z"
                      fill="#FB923C"/>
              </svg>
              <div>
                <div className="text-xl font-bold text-orange-500">AdoptSmart</div>
                <div className="text-xs text-gray-500 -mt-1">Find your new best friend</div>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link
                to="/home"
                className="flex items-center gap-2 text-gray-700 hover:text-orange-500 transition-colors font-medium"
              >
                <HomeIcon className="h-5 w-5" />
                <span>Home</span>
              </Link>
              <Link
                to="/pets"
                className="flex items-center gap-2 text-orange-500 font-semibold transition-colors"
              >
                <Search className="h-5 w-5" />
                <span>Find Pet</span>
              </Link>
              <Link
                to="/success-stories"
                className="flex items-center gap-2 text-gray-700 hover:text-orange-500 transition-colors font-medium"
              >
                <Star className="h-5 w-5" />
                <span>Success Stories</span>
              </Link>
            </div>

            <div className="hidden md:block relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 rounded-full bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 transition-colors shadow-md"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-orange-500 font-semibold">
                  {getUserInitials()}
                </div>
                <span className="font-medium">{user?.username || "User"}</span>
              </button>

              {showProfileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-xl border border-gray-200 z-20">
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-orange-50 rounded-t-lg transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <User className="h-5 w-5" />
                      <span>View Profile</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-b-lg transition-colors cursor-pointer"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-700 hover:text-orange-500"
            >
              {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {showMobileMenu && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <div className="flex flex-col gap-4">
                <Link
                  to="/home"
                  className="flex items-center gap-2 text-gray-700 hover:text-orange-500 py-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <HomeIcon className="h-5 w-5" />
                  <span>Home</span>
                </Link>
                <Link
                  to="/pets"
                  className="flex items-center gap-2 text-orange-500 font-semibold py-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Search className="h-5 w-5" />
                  <span>Find Pet</span>
                </Link>
                <Link
                  to="/success-stories"
                  className="flex items-center gap-2 text-gray-700 hover:text-orange-500 py-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Star className="h-5 w-5" />
                  <span>Success Stories</span>
                </Link>
                <hr className="border-gray-200" />
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-gray-700 hover:text-orange-500 py-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <User className="h-5 w-5" />
                  <span>View Profile</span>
                </Link>
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 py-2 cursor-pointer"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <Button
          onClick={() => navigate(-1)}
          variant="outline"
          className="mb-6 gap-2 border-2 border-orange-500 text-orange-600 hover:bg-orange-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pets
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-white">
              <img
                src={pet.imageUrl || "/placeholder-pet.jpg"}
                alt={pet.name}
                className="w-full h-[calc(100vh-180px)] object-contain bg-gradient-to-br from-gray-50 to-gray-100"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder-pet.jpg";
                }}
              />
              <button
                type="button"
                disabled={favoriteBusy}
                onClick={handleToggleFavorite}
                className="absolute top-4 right-4 bg-white rounded-full p-3 shadow-lg cursor-pointer hover:scale-110 transition-transform disabled:opacity-60"
                aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart className={`h-6 w-6 ${favorited ? "text-orange-500 fill-orange-500" : "text-orange-500 hover:fill-orange-500"}`} />
              </button>
              {pet.adoptionType === "Paid" && pet.price && (
                <div className="absolute top-4 left-4 bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-2.5 rounded-full text-lg font-bold shadow-xl flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  LKR {pet.price.toLocaleString()}
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-5xl font-bold text-white mb-2">{pet.name}</h1>
                    <div className="flex gap-2">
                      <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-800">
                        {capitalize(pet.species)}
                      </span>
                      <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-800">
                        {capitalize(pet.breed)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`px-4 py-2 rounded-full font-bold text-sm ${
                      pet.status === "Available" 
                        ? "bg-green-500 text-white" 
                        : pet.status === "Pending" 
                        ? "bg-yellow-500 text-white" 
                        : "bg-red-500 text-white"
                    }`}>
                      {pet.status === "Available" && <CheckCircle className="inline h-4 w-4 mr-1" />}
                      {pet.status}
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      <span className="font-semibold text-gray-900 text-sm">Posted {getTimeAgo(pet.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Button
              onClick={handleAdoptClick}
              disabled={pet.status !== "Available"}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-6 text-lg font-bold shadow-2xl hover:shadow-3xl transition-all disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed rounded-2xl"
            >
              {pet.status === "Available" ? (
                <>
                  <Heart className="h-6 w-6 mr-2" />
                  Adopt {pet.name} Now
                </>
              ) : (
                `This pet is ${pet.status}`
              )}
            </Button>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <PawPrint className="h-6 w-6 text-orange-500" />
                Quick Info
              </h2>

              <div className="flex items-center gap-4">
                <div className="bg-orange-500 p-3 rounded-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Age</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatAge(pet.age)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-blue-500 p-3 rounded-lg">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="text-xl font-bold text-gray-900">{capitalize(pet.gender)}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-purple-500 p-3 rounded-lg">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="text-xl font-bold text-gray-900">{capitalize(pet.location)}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-green-500 p-3 rounded-lg">
                  <PawPrint className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Adoption Type</p>
                  <p className="text-xl font-bold text-gray-900">{pet.adoptionType}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl p-6 border-2 border-orange-300">
              <h3 className="font-bold text-gray-900 mb-3 text-lg flex items-center gap-2">
                <Heart className="h-6 w-6 text-orange-600" />
                Why Adopt?
              </h3>
              <ul className="space-y-2 text-sm text-gray-800">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>Save a life and give a pet a loving home</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>Support responsible pet ownership</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>Gain a loyal companion for life</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <PawPrint className="h-8 w-8 text-orange-500" />
            About {pet.name}
          </h2>
          <p className="text-gray-700 leading-relaxed text-lg">{pet.description}</p>
        </div>

        <div className="mt-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
            <User className="h-8 w-8 text-orange-500" />
            Owner Information
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-orange-500 p-3 rounded-full">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="text-lg font-bold text-gray-900">{pet.ownerId.username}</p>
              </div>
            </div>
            {pet.ownerId.email && (
              <div className="flex items-center gap-4">
                <div className="bg-blue-500 p-3 rounded-full">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-lg font-bold text-gray-900 break-all">{pet.ownerId.email}</p>
                </div>
              </div>
            )}
            {(pet.ownerId.contactNumber || pet.contactInfo) && (
              <div className="flex items-center gap-4">
                <div className="bg-green-500 p-3 rounded-full">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-lg font-bold text-gray-900">{pet.ownerId.contactNumber || pet.contactInfo}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAdoptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-2xl sticky top-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Heart className="h-6 w-6" />
                  <h2 className="text-2xl font-bold">Adoption Request</h2>
                </div>
                <button
                  onClick={() => setShowAdoptModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="text-orange-100 mt-2">
                Send a message to adopt {pet.name}
              </p>
            </div>

            <form onSubmit={handleSendEmail} className="p-6 space-y-4">
              {/* removed "Your Email" input; backend uses token user email */}

              {mailStatus && (
                <div
                  className={`rounded-lg border px-4 py-3 text-sm font-medium ${
                    mailStatus.type === "success"
                      ? "border-green-200 bg-green-50 text-green-800"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {mailStatus.text}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={emailData.message}
                  onChange={(e) =>
                    setEmailData({ ...emailData, message: e.target.value })
                  }
                  required
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-colors resize-none"
                  placeholder="Tell the owner why you'd like to adopt this pet..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowAdoptModal(false)}
                  variant="outline"
                  className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 py-3"
                  disabled={sendingEmail}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={sendingEmail}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg py-3"
                >
                  {sendingEmail ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Send Request
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-20 right-4 z-[60]">
          <div
            className={`rounded-xl border px-4 py-3 shadow-xl text-sm font-semibold ${
              toast.type === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {toast.text}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default PetDetail;

