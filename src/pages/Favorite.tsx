import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Home as HomeIcon, LogOut, Menu, Search, Star, User, X, PawPrint, MapPin } from "lucide-react";
import { Button } from "../components/button";
import Footer from "../components/Footer";
import { getMyFavorites, removeFavorite } from "../services/favorite";
import { useAuth } from "../context/authContext";

type AgeUnit = "Months" | "Years";
type PetAge = { value: number; unit: AgeUnit };

interface PetOwner {
  _id: string;
  username: string;
  email?: string;
  profilePicture?: string | null;
  contactNumber?: string;
  location?: string;
}

interface Pet {
  _id: string;
  ownerId: PetOwner;
  name: string;
  species: string;
  breed: string;
  age: PetAge;
  gender: string;
  description: string;
  imageUrl: string;
  adoptionType: "Free" | "Paid";
  price?: number;
  contactInfo?: string;
  location: string;
  status: "Available" | "Adopted" | "Pending";
  createdAt?: string;
}

const Favorite = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [items, setItems] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true, state: { from: "/favorites" } });
      return;
    }
    const run = async () => {
      try {
        setLoading(true);
        setErrMsg(null);
        const res = await getMyFavorites(1, 50);
        setItems((res.data || []) as Pet[]);
      } catch (e: any) {
        const apiMsg = e?.response?.data?.message;
        setErrMsg(apiMsg || "Failed to load favorites");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user, navigate]);

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

  const capitalize = (str: string) => (!str ? "" : str.charAt(0).toUpperCase() + str.slice(1).toLowerCase());

  const formatAgeLabel = (age: PetAge) => {
    if (!age || !age.value) return "Unknown";
    const unit = age.unit === "Months" || age.unit === "Years" ? age.unit : "Years";
    return `${age.value} ${age.value === 1 ? unit.slice(0, -1) : unit}`;
  };

  const handleRemove = async (petId: string) => {
    const prev = items;
    setItems((cur) => cur.filter((p) => p._id !== petId)); // optimistic
    try {
      await removeFavorite(petId);
    } catch (e: any) {
      console.error("Failed to remove favorite:", e);
      setItems(prev); // rollback
      setErrMsg(e?.response?.data?.message || "Failed to remove favorite");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      <nav className="sticky top-0 z-50 bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="text-xl font-bold text-orange-500">AdoptSmart</div>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link to="/home" className="flex items-center gap-2 text-gray-700 hover:text-orange-500 transition-colors font-medium">
                <HomeIcon className="h-5 w-5" />
                <span>Home</span>
              </Link>
              <Link to="/pets" className="flex items-center gap-2 text-gray-700 hover:text-orange-500 transition-colors font-medium">
                <Search className="h-5 w-5" />
                <span>Find Pet</span>
              </Link>
              <Link to="/success-stories" className="flex items-center gap-2 text-gray-700 hover:text-orange-500 transition-colors font-medium">
                <Star className="h-5 w-5" />
                <span>Success Stories</span>
              </Link>
              <Link to="/favorites" className="flex items-center gap-2 text-orange-500 font-semibold transition-colors">
                <Heart className="h-5 w-5" />
                <span>Favorites</span>
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
                  <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
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

            <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden p-2 text-gray-700 hover:text-orange-500">
              {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {showMobileMenu && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <div className="flex flex-col gap-4">
                <Link to="/home" className="flex items-center gap-2 text-gray-700 hover:text-orange-500 py-2" onClick={() => setShowMobileMenu(false)}>
                  <HomeIcon className="h-5 w-5" />
                  <span>Home</span>
                </Link>
                <Link to="/pets" className="flex items-center gap-2 text-gray-700 hover:text-orange-500 py-2" onClick={() => setShowMobileMenu(false)}>
                  <Search className="h-5 w-5" />
                  <span>Find Pet</span>
                </Link>
                <Link to="/success-stories" className="flex items-center gap-2 text-gray-700 hover:text-orange-500 py-2" onClick={() => setShowMobileMenu(false)}>
                  <Star className="h-5 w-5" />
                  <span>Success Stories</span>
                </Link>
                <Link to="/favorites" className="flex items-center gap-2 text-orange-500 font-semibold py-2" onClick={() => setShowMobileMenu(false)}>
                  <Heart className="h-5 w-5" />
                  <span>Favorites</span>
                </Link>
                <hr className="border-gray-200" />
                <Link to="/profile" className="flex items-center gap-2 text-gray-700 hover:text-orange-500 py-2" onClick={() => setShowMobileMenu(false)}>
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

      <div className="container mx-auto px-6 md:px-8 lg:px-12 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center gap-2">
            <Heart className="h-7 w-7 text-orange-500" />
            My Favorites
          </h1>
          <Link to="/pets">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">Browse Pets</Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-gray-600 font-medium">Loading...</div>
        ) : errMsg ? (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3">{errMsg}</div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-orange-100 p-14 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 mb-6">
              <PawPrint className="h-10 w-10 text-orange-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">No favorites yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">Tap the heart on a pet to save it here.</p>
            <Link to="/pets">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">Find Pets</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((pet) => (
              <div key={pet._id} className="group overflow-hidden rounded-xl bg-white shadow-md border border-orange-100">
                <div className="aspect-[16/9] overflow-hidden bg-gray-100 relative">
                  <img
                    src={pet.imageUrl || "/placeholder-pet.jpg"}
                    alt={pet.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder-pet.jpg";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemove(pet._id)}
                    className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md cursor-pointer"
                    aria-label="Remove from favorites"
                  >
                    <Heart className="h-4 w-4 text-orange-500 fill-orange-500" />
                  </button>
                  {pet.adoptionType === "Paid" && pet.price && (
                    <div className="absolute top-2 left-2 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                      LKR {pet.price.toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 truncate" title={pet.name}>
                    {capitalize(pet.name)}
                  </h3>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                      {capitalize(pet.breed)}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {formatAgeLabel(pet.age)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-4">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate font-medium">{capitalize(pet.location)}</span>
                  </div>

                  <Link to={`/pets/${pet._id}`} className="block w-full">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm py-2 font-semibold shadow-md hover:shadow-lg transition-all">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Favorite;

