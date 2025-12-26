import { useEffect, useMemo, useState } from "react";
import { Button } from "../components/button";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  X,
  MapPin,
  Heart,
  Filter,
  PawPrint,
  Home as HomeIcon,
  Star,
  User,
  LogOut,
  Menu,
  Plus,
} from "lucide-react";
import { getApprovedPetPosts } from "../services/petPost.ts";
import { useAuth } from "../context/authContext";
import findPetBg from "../assets/findpet.png";
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
  owner?: {
    username: string;
    name?: string;
    contactNumber?: string;
  };
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
  updatedAt?: string;
}

const FindPet = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [filteredPets, setFilteredPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState("All");
  const [selectedGender, setSelectedGender] = useState("All");
  const [selectedAdoptionType, setSelectedAdoptionType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("Available");
  const [ageRange, setAgeRange] = useState({ min: 0, max: 20 });
  const [sortBy, setSortBy] = useState("newest");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [favoriteMap, setFavoriteMap] = useState<Record<string, boolean>>({});
  const [favoriteBusy, setFavoriteBusy] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const toastTimerMs = 2000;

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const visiblePetIds = useMemo(
    () => filteredPets.map((p) => p._id),
    [filteredPets]
  );

  useEffect(() => {
    fetchPets();
  }, []);

  useEffect(() => {
    filterAndSortPets();
  }, [pets, searchQuery, selectedSpecies, selectedGender, selectedAdoptionType, selectedStatus, ageRange, sortBy]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // load favorites for current visible pets (best-effort)
    const run = async () => {
      if (!user) {
        setFavoriteMap({});
        return;
      }
      const ids = visiblePetIds.slice(0, 50);
      try {
        const results = await Promise.all(
          ids.map(async (petId) => {
            try {
              const r = await isFavorite(petId);
              return [petId, r.favorited] as const;
            } catch {
              return [petId, false] as const;
            }
          })
        );
        setFavoriteMap((prev) => {
          const next = { ...prev };
          for (const [id, fav] of results) next[id] = fav;
          return next;
        });
      } catch {
        // ignore
      }
    };
    run();
  }, [user, visiblePetIds]);

  const ageToYears = (age: PetAge) => {
    if (!age) return 0;
    if (age.unit === "Years") return age.value;
    return age.value / 12;
  };

  const fetchPets = async () => {
    try {
      setLoading(true);
      const response = await getApprovedPetPosts(1, 100);
      const rawPets = response.data?.data || response.data?.petPosts || response.data || [];

      const mappedPets: Pet[] = (rawPets as any[]).map((p) => {
        const rawAge = p.age as any;
        let age: PetAge = { value: 0, unit: "Years" };

        if (rawAge && typeof rawAge === "object" && "value" in rawAge && "unit" in rawAge) {
          age = {
            value: Number(rawAge.value) || 0,
            unit:
              rawAge.unit === "Months" || rawAge.unit === "Years"
                ? rawAge.unit
                : "Years",
          };
        }

        return {
          ...p,
          age,
          ownerId: p.ownerId,
          owner: {
            username: p.ownerId?.username ?? "Unknown",
            contactNumber: p.ownerId?.contactNumber ?? p.contactInfo ?? undefined,
          },
        };
      });

      setPets(mappedPets);
      const availablePets = mappedPets.filter((pet) => pet.status === "Available");
      setFilteredPets(availablePets);
    } catch (error) {
      console.error("Error fetching pets:", error);
      setPets([]);
      setFilteredPets([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortPets = () => {
    let filtered = [...pets];

    if (selectedStatus !== "All") {
      filtered = filtered.filter((pet) => pet.status === selectedStatus);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (pet) =>
          pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pet.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pet.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedSpecies !== "All") {
      filtered = filtered.filter((pet) => pet.species === selectedSpecies);
    }

    if (selectedGender !== "All") {
      filtered = filtered.filter(
        (pet) => pet.gender.toLowerCase() === selectedGender.toLowerCase()
      );
    }

    if (selectedAdoptionType !== "All") {
      filtered = filtered.filter((pet) => pet.adoptionType === selectedAdoptionType);
    }

    filtered = filtered.filter((pet) => {
      const years = ageToYears(pet.age);
      return years >= ageRange.min && years <= ageRange.max;
    });

    switch (sortBy) {
      case "newest":
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) =>
            new Date(a.createdAt || 0).getTime() -
            new Date(b.createdAt || 0).getTime()
        );
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "age-low":
        filtered.sort((a, b) => ageToYears(a.age) - ageToYears(b.age));
        break;
      case "age-high":
        filtered.sort((a, b) => ageToYears(b.age) - ageToYears(a.age));
        break;
      case "price-low":
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price-high":
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
    }

    setFilteredPets(filtered);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSpecies("All");
    setSelectedGender("All");
    setSelectedAdoptionType("All");
    setSelectedStatus("Available");
    setAgeRange({ min: 0, max: 20 });
    setSortBy("newest");
  };

  const getUniqueSpecies = () => {
    const species = pets.map((pet) => pet.species);
    return ["All", ...Array.from(new Set(species))];
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

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return "Just now";
    const now = new Date();
    const posted = new Date(dateString);
    const diffInMs = now.getTime() - posted.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60)
      return `${diffInMinutes} ${
        diffInMinutes === 1 ? "minute" : "minutes"
      } ago`;
    if (diffInHours < 24)
      return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
    if (diffInDays < 7)
      return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
    if (diffInDays < 30)
      return `${Math.floor(diffInDays / 7)} ${
        Math.floor(diffInDays / 7) === 1 ? "week" : "weeks"
      } ago`;
    return `${Math.floor(diffInDays / 30)} ${
      Math.floor(diffInDays / 30) === 1 ? "month" : "months"
    } ago`;
  };

  const capitalize = (str: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const formatAgeLabel = (age: PetAge) => {
    if (!age || !age.value) return "Unknown";
    const unit =
      age.unit === "Months" || age.unit === "Years" ? age.unit : "Years";
    return `${age.value} ${age.value === 1 ? unit.slice(0, -1) : unit}`;
  };

  const toggleFavorite = async (petId: string) => {
    if (!user) {
      navigate("/login", { replace: true, state: { from: "/pets" } });
      return;
    }
    if (favoriteBusy[petId]) return;

    const nextFav = !favoriteMap[petId];

    setFavoriteBusy((m) => ({ ...m, [petId]: true }));
    setFavoriteMap((m) => ({ ...m, [petId]: nextFav })); // optimistic

    try {
      await apiToggleFavorite(petId, nextFav);
      setToast({ type: "success", text: nextFav ? "Added to favorites" : "Removed from favorites" });
      window.setTimeout(() => setToast(null), toastTimerMs);
    } catch (e) {
      setFavoriteMap((m) => ({ ...m, [petId]: !nextFav })); // rollback
      setToast({ type: "error", text: "Favorite update failed" });
      window.setTimeout(() => setToast(null), toastTimerMs);
      console.error("Favorite toggle failed:", e);
    } finally {
      setFavoriteBusy((m) => ({ ...m, [petId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-orange-50 to-yellow-50">
      <nav className="sticky top-0 z-50 bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
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

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link
                to="/home"
                className="flex items-center gap-2 text-gray-700 hover:text-orange-500 transition-colors font-medium"
              >
                <HomeIcon className="h-5 w-5"/>
                <span>Home</span>
              </Link>
              <Link
                to="/pets"
                className="flex items-center gap-2 text-orange-500 font-semibold transition-colors"
              >
                <Search className="h-5 w-5"/>
                <span>Find Pet</span>
              </Link>
              <Link
                to="/success-stories"
                className="flex items-center gap-2 text-gray-700 hover:text-orange-500 transition-colors font-medium"
              >
                <Star className="h-5 w-5"/>
                <span>Success Stories</span>
              </Link>
            </div>

            {/* Profile Dropdown */}
            <div className="hidden md:block relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 rounded-full bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 transition-colors shadow-md"
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-orange-500 font-semibold">
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
                  <div
                    className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-xl border border-gray-200 z-20">
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-orange-50 rounded-t-lg transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <User className="h-5 w-5"/>
                      <span>View Profile</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-b-lg transition-colors cursor-pointer"
                    >
                      <LogOut className="h-5 w-5"/>
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-700 hover:text-orange-500"
            >
              {showMobileMenu ? <X className="h-6 w-6"/> : <Menu className="h-6 w-6"/>}
            </button>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <div className="flex flex-col gap-4">
                <Link
                  to="/"
                  className="flex items-center gap-2 text-gray-700 hover:text-orange-500 py-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <HomeIcon className="h-5 w-5"/>
                  <span>Home</span>
                </Link>
                <Link
                  to="/pets"
                  className="flex items-center gap-2 text-orange-500 font-semibold py-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Search className="h-5 w-5"/>
                  <span>Find Pet</span>
                </Link>
                <Link
                  to="/success-stories"
                  className="flex items-center gap-2 text-gray-700 hover:text-orange-500 py-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Star className="h-5 w-5"/>
                  <span>Success Stories</span>
                </Link>
                <hr className="border-gray-200"/>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-gray-700 hover:text-orange-500 py-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <User className="h-5 w-5"/>
                  <span>View Profile</span>
                </Link>
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 py-2 cursor-pointer"
                >
                  <LogOut className="h-5 w-5"/>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="relative overflow-hidden h-[280px] md:h-[320px]">

        <div
          className="absolute inset-0 z-0 bg-no-repeat"
          style={{
            backgroundImage: `url(${findPetBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center center",
          }}
        >
          <div className="absolute inset-0 bg-black/15" />
          <div className="absolute inset-0 backdrop-blur-[2px]" />
        </div>

        <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl mx-auto text-center w-full">

            <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/40 backdrop-blur-md px-3 py-1.5 text-xs font-semibold mb-3 shadow-lg border border-orange-300/70">
               <PawPrint className="h-3.5 w-3.5 text-white animate-pulse" />
               <span className="text-white">{filteredPets.length} adorable pets waiting</span>
             </div>

            <h1 className="text-2xl md:text-4xl font-black mb-3 text-white drop-shadow-2xl leading-tight">
              Discover Your
              <span className="block bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent mt-1">
                Perfect Companion
              </span>
            </h1>

            <p className="text-sm md:text-base text-white/95 mb-5 max-w-xl mx-auto font-medium drop-shadow-lg">
              Every pet deserves a loving home. Start your journey to unconditional love today.
            </p>

            <div className="relative max-w-lg mx-auto group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 via-orange-400 to-orange-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300" />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500 z-10" />
                <input
                  type="text"
                  placeholder="Search by name, breed, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/95 backdrop-blur-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-300/50 shadow-xl text-sm font-medium border border-white/50"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-orange-50 to-transparent z-10" />
      </div>

      <div className="container mx-auto px-6 md:px-8 lg:px-12 py-10 md:py-14">
        <div className="hidden md:block mb-10">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border-2 border-orange-100 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Filter className="h-5 w-5 text-orange-500" />
                Filters
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-600">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 rounded-xl border-2 border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-700 font-medium shadow-sm hover:border-orange-300 transition-all text-sm"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name">Name (A-Z)</option>
                    <option value="age-low">Age (Low to High)</option>
                    <option value="age-high">Age (High to Low)</option>
                    <option value="price-low">Price (Low to High)</option>
                    <option value="price-high">Price (High to Low)</option>
                  </select>
                </div>
                <button
                  onClick={clearFilters}
                  className="text-sm text-orange-600 hover:text-orange-700 font-semibold hover:underline transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 pb-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Species</label>
                <div className="flex flex-wrap gap-2">
                  {getUniqueSpecies().map((species) => (
                    <button
                      key={species}
                      onClick={() => setSelectedSpecies(species)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                        selectedSpecies === species
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg scale-105"
                          : "bg-gray-100 text-gray-700 hover:bg-orange-100 hover:text-orange-600"
                      }`}
                    >
                      {species}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Gender</label>
                <div className="flex flex-wrap gap-2">
                  {["All", "Male", "Female"].map((gender) => (
                    <button
                      key={gender}
                      onClick={() => setSelectedGender(gender)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                        selectedGender === gender
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg scale-105"
                          : "bg-gray-100 text-gray-700 hover:bg-orange-100 hover:text-orange-600"
                      }`}
                    >
                      {gender}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Adoption Type</label>
                <div className="flex flex-wrap gap-2">
                  {["All", "Free", "Paid"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedAdoptionType(type)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                        selectedAdoptionType === type
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg scale-105"
                          : "bg-gray-100 text-gray-700 hover:bg-orange-100 hover:text-orange-600"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Age: {ageRange.min} - {ageRange.max} yrs
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={ageRange.max}
                  onChange={(e) => setAgeRange({ ...ageRange, max: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gradient-to-r from-orange-200 to-orange-300 rounded-full appearance-none cursor-pointer accent-orange-500 shadow-inner"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="md:hidden mb-8 px-2">
          <Button
            onClick={() => setShowFilters(true)}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white gap-2 shadow-xl py-6 rounded-2xl font-bold text-lg"
          >
            <SlidersHorizontal className="h-6 w-6" />
            Show Filters ({filteredPets.length} results)
          </Button>
        </div>

        <main className="px-2 md:px-0">
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl bg-white shadow-md border border-orange-100">
                  <div className="aspect-[16/9] bg-gradient-to-br from-orange-100 via-orange-200 to-orange-300 animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />
                    <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
                    <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
                    <div className="h-10 bg-orange-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPets.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md border border-orange-100 p-20 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 mb-6">
                <PawPrint className="h-10 w-10 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">No pets found</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Try adjusting your filters or search query to find your perfect companion
              </p>
              <Button
                onClick={clearFilters}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredPets.map((pet) => {
                const favorited = Boolean(favoriteMap[pet._id]);
                const busy = Boolean(favoriteBusy[pet._id]);

                return (
                  <div
                    key={pet._id}
                    className="group overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-xl border border-orange-100 hover:border-orange-200"
                  >
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
                        disabled={busy}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          void toggleFavorite(pet._id);
                        }}
                        className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md disabled:opacity-60 cursor-pointer"
                        aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Heart
                          className={`h-4 w-4 transition-colors ${
                            favorited ? "text-orange-500 fill-orange-500" : "text-gray-400 hover:text-orange-500"
                          }`}
                        />
                      </button>

                      {pet.adoptionType === "Paid" && pet.price && (
                        <div className="absolute top-2 left-2 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                          LKR {pet.price.toLocaleString()}
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3
                        className="text-lg font-bold text-gray-900 mb-2 truncate"
                        title={pet.name}
                      >
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

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="truncate font-medium">{capitalize(pet.location)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">Posted {getTimeAgo(pet.createdAt)}</span>
                        </div>
                      </div>

                      <Link to={`/pets/${pet._id}`} className="block w-full">
                        <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm py-2 font-semibold shadow-md hover:shadow-lg transition-all">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Filter className="h-5 w-5 text-orange-500" />
                Filters
              </h2>
              <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Species</label>
                <div className="grid grid-cols-2 gap-2">
                  {getUniqueSpecies().map((species) => (
                    <button
                      key={species}
                      onClick={() => setSelectedSpecies(species)}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        selectedSpecies === species
                          ? "bg-orange-500 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-orange-100 hover:text-orange-600"
                      }`}
                    >
                      {species}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Gender</label>
                <div className="grid grid-cols-3 gap-2">
                  {["All", "Male", "Female"].map((gender) => (
                    <button
                      key={gender}
                      onClick={() => setSelectedGender(gender)}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        selectedGender === gender
                          ? "bg-orange-500 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-orange-100 hover:text-orange-600"
                      }`}
                    >
                      {gender}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Adoption Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {["All", "Free", "Paid"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedAdoptionType(type)}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        selectedAdoptionType === type
                          ? "bg-orange-500 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-orange-100 hover:text-orange-600"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {["All", "Available", "Pending", "Adopted"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        selectedStatus === status
                          ? "bg-orange-500 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-orange-100 hover:text-orange-600"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Age Range: {ageRange.min} - {ageRange.max} years
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={ageRange.max}
                  onChange={(e) => setAgeRange({ ...ageRange, max: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>

              <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-2">
                <Button onClick={clearFilters} variant="outline" className="flex-1 border-2 border-orange-500 text-orange-600 hover:bg-orange-50">
                  Clear All
                </Button>
                <Button onClick={() => setShowFilters(false)} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white shadow-md">
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />

      {/* Floating Add Pet Button - bottom right */}
      {showScrollButton ? (
        <Link to="/add-pet">
          <button
            className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full p-4 shadow-2xl transition-all duration-300 group hover:scale-110"
            aria-label="Add Pet for Adoption"
          >
            <Plus className="h-6 w-6" />
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Add Pet for Adoption
            </span>
          </button>
        </Link>
      ) : (
        <Link to="/add-pet">
          <button
            className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full px-5 py-3 shadow-2xl transition-all duration-300 flex items-center gap-2 group hover:scale-105"
            aria-label="Add Pet for Adoption"
          >
            <Plus className="h-5 w-5" />
            <span className="font-semibold text-sm">Add Pet</span>
          </button>
        </Link>
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
    </div>
  );
};

export default FindPet;

