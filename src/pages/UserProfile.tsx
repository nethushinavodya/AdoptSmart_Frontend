import { useEffect, useState } from "react";
import { useAuth } from "../context/authContext";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  X,
  LogOut,
  PawPrint,
  Clock,
  Trash2,
  Home as HomeIcon,
  Star,
  Search,
  Menu, TrendingUp, Edit, Heart, Calendar, Award,
} from "lucide-react";
import { Button } from "../components/button";
import { getApprovedPetPosts, getPendingPetPosts, deletePetPost } from "../services/petPost";
import { getAllSuccessStories, deleteSuccessStory } from "../services/successStory";
import { getMyFavorites, removeFavorite } from "../services/favorite";
import { updateUser } from "../services/user";
import Footer from "../components/Footer";

type AgeUnit = "Months" | "Years";
interface PetAge {
  value: number;
  unit: AgeUnit;
}

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

interface StoryOwner {
  _id: string;
  username: string;
  email?: string;
  profilePicture?: string | null;
}

interface ISuccessStory {
  _id: string;
  userId: StoryOwner | string;
  title: string;
  description: string;
  images: string[];
  createdAt?: string;
  updatedAt?: string;
}

type TabType = "pets" | "stories" | "favorites" | "pending";

const UserProfile = () => {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>("pets");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [myPets, setMyPets] = useState<Pet[]>([]);
  const [myStories, setMyStories] = useState<ISuccessStory[]>([]);
  const [myFavorites, setMyFavorites] = useState<Pet[]>([]);
  const [pendingPets, setPendingPets] = useState<Pet[]>([]);

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [editForm, setEditForm] = useState({
    email: user?.email || "",
    contactNumber: user?.contactNumber || "",
    location: user?.location || "",
    profilePicture: null as File | null,
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    fetchAllData();
  }, [user, navigate]);

  const fetchAllData = async () => {
    if (!user?._id) return;

    try {
      setLoading(true);

      const [approvedRes, pendingRes, storiesRes, favsRes] = await Promise.allSettled([
        getApprovedPetPosts(1, 500),
        getPendingPetPosts(1, 500),
        getAllSuccessStories(1, 500),
        getMyFavorites(1, 100),
      ]);

      if (approvedRes.status === "fulfilled") {
        const approvedPets = approvedRes.value?.data?.data || approvedRes.value?.data || [];
        // these are approved for everyone; filter to current user's posts
        const userApproved = approvedPets.filter(
          (p: any) => p.ownerId?._id === user._id || p.ownerId === user._id
        );
        setMyPets(userApproved);
      }

      if (pendingRes.status === "fulfilled") {
        // backend already filters by ownerId; no need to filter again
        const pendingPets = pendingRes.value?.data?.data || pendingRes.value?.data || [];
        setPendingPets(pendingPets);
      } else {
        // if pending endpoint fails (e.g., 401), keep it empty
        setPendingPets([]);
      }

      if (storiesRes.status === "fulfilled") {
        const allStoriesData = storiesRes.value?.data?.data || storiesRes.value?.data || [];
        const userStories = allStoriesData.filter((s: any) => {
          const userId = typeof s.userId === "string" ? s.userId : s.userId?._id;
          return userId === user._id;
        });
        setMyStories(userStories);
      }

      if (favsRes.status === "fulfilled") {
        setMyFavorites((favsRes.value?.data || []) as Pet[]);
      }
    } catch (err) {
      console.error("Error fetching profile data:", err);
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

  const handleDeletePet = async (petId: string) => {
    if (!confirm("Are you sure you want to delete this pet post?")) return;
    try {
      await deletePetPost(petId);
      setMyPets((prev) => prev.filter((p) => p._id !== petId));
      setPendingPets((prev) => prev.filter((p) => p._id !== petId));
      showToast("success", "Pet post deleted successfully");
    } catch (err) {
      console.error("Failed to delete pet:", err);
      showToast("error", "Failed to delete pet post");
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm("Are you sure you want to delete this success story?")) return;
    try {
      await deleteSuccessStory(storyId);
      setMyStories((prev) => prev.filter((s) => s._id !== storyId));
      showToast("success", "Success story deleted");
    } catch (err) {
      console.error("Failed to delete story:", err);
      showToast("error", "Failed to delete story");
    }
  };

  const handleRemoveFavorite = async (petId: string) => {
    try {
      await removeFavorite(petId);
      setMyFavorites((prev) => prev.filter((p) => p._id !== petId));
      showToast("success", "Removed from favorites");
    } catch (err) {
      console.error("Failed to remove favorite:", err);
      showToast("error", "Failed to remove favorite");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEditForm((prev) => ({ ...prev, profilePicture: file }));
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id) return;

    setSaving(true);
    try {
      const res = await updateUser(user._id, {
        email: editForm.email,
        contactNumber: editForm.contactNumber,
        location: editForm.location,
        image: editForm.profilePicture,
      });

      // Update the user context with the new data including Cloudinary URL
      setUser(res.data);

      // Reset the form and preview
      setEditForm({
        email: res.data.email || "",
        contactNumber: res.data.contactNumber || "",
        location: res.data.location || "",
        profilePicture: null,
      });
      setPreviewImage(null);

      setShowEditModal(false);
      showToast("success", "Profile updated successfully");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to update profile";
      showToast("error", msg);
    } finally {
      setSaving(false);
    }
  };

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 3000);
  };

  const capitalize = (str: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const formatAgeLabel = (age: PetAge) => {
    if (!age || !age.value) return "Unknown";
    const unit = age.unit === "Months" || age.unit === "Years" ? age.unit : "Years";
    return `${age.value} ${age.value === 1 ? unit.slice(0, -1) : unit}`;
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

  const renderPetCard = (pet: Pet, onDelete: (id: string) => void) => (
    <div key={pet._id} className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
      <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 relative">
        <img
          src={pet.imageUrl || "/placeholder-pet.jpg"}
          alt={pet.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder-pet.jpg";
          }}
        />
        {pet.adoptionType === "Paid" && pet.price && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-lg flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            LKR {pet.price.toLocaleString()}
          </div>
        )}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold shadow-lg ${
          pet.status === "Available" 
            ? "bg-green-500 text-white" 
            : pet.status === "Pending" 
            ? "bg-yellow-500 text-white" 
            : "bg-red-500 text-white"
        }`}>
          {pet.status}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3">
          <div className="flex items-center gap-1.5 text-white/90 text-xs">
            <Calendar className="h-3 w-3" />
            <span className="font-medium">{getTimeAgo(pet.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-base font-black text-gray-900 mb-2 truncate" title={pet.name}>
          {capitalize(pet.name)}
        </h3>

        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-orange-100 text-orange-700">
            {capitalize(pet.breed)}
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-700">
            {formatAgeLabel(pet.age)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-4">
          <MapPin className="h-3.5 w-3.5 text-orange-500" />
          <span className="truncate font-medium">{capitalize(pet.location)}</span>
        </div>

        <div className="flex gap-2">
          <Link to={`/pets/${pet._id}`} className="flex-1">
            <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs py-2 font-bold">
              View Details
            </Button>
          </Link>
          <Button
            onClick={() => onDelete(pet._id)}
            variant="outline"
            className="border-2 border-red-500 text-red-600 hover:bg-red-50 px-2.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderStoryCard = (story: ISuccessStory) => (
    <div key={story._id} className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
      <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 relative">
        <img
          src={story.images[0] || "/placeholder-pet.jpg"}
          alt={story.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder-pet.jpg";
          }}
        />
        {story.images.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Award className="h-3 w-3" />
            +{story.images.length - 1}
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3">
          <div className="flex items-center gap-1.5 text-white/90 text-xs">
            <Calendar className="h-3 w-3" />
            <span className="font-medium">{getTimeAgo(story.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-base font-black text-gray-900 mb-2 line-clamp-1" title={story.title}>
          {story.title}
        </h3>
        <p className="text-xs text-gray-600 mb-4 line-clamp-2 leading-relaxed">{story.description}</p>

        <Button
          onClick={() => handleDeleteStory(story._id)}
          variant="outline"
          className="w-full border-2 border-red-500 text-red-600 hover:bg-red-50 font-bold text-xs py-2"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Delete Story
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-50 to-orange-200">
      {/* Navbar - Same as FindPet */}
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
                className="flex items-center gap-2 text-gray-700 hover:text-orange-500 transition-colors font-medium"
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
                      className="flex items-center gap-3 px-4 py-3 text-orange-600 font-semibold bg-orange-50 rounded-t-lg transition-colors"
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
                  to="/home"
                  className="flex items-center gap-2 text-gray-700 hover:text-orange-500 py-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <HomeIcon className="h-5 w-5"/>
                  <span>Home</span>
                </Link>
                <Link
                  to="/pets"
                  className="flex items-center gap-2 text-gray-700 hover:text-orange-500 py-2"
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
                  className="flex items-center gap-2 text-orange-600 font-semibold py-2"
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

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6 border border-gray-100">
          <div className="relative h-24 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
          </div>

          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-12 relative">
              <div className="relative group">
                <div className="w-24 h-24 rounded-xl bg-white shadow-xl flex items-center justify-center overflow-hidden ring-4 ring-white">
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-orange-500 text-3xl font-black">{getUserInitials()}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                  Active
                </div>
              </div>

              <div className="flex-1 mt-2 md:mt-0">
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">
                  {user?.username || "User"}
                </h1>
                <div className="flex flex-wrap gap-2">
                  {user?.email && (
                    <div className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-lg">
                      <Mail className="h-3.5 w-3.5 text-gray-600" />
                      <span className="text-xs font-medium text-gray-700">{user.email}</span>
                    </div>
                  )}
                  {user?.contactNumber && (
                    <div className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-lg">
                      <Phone className="h-3.5 w-3.5 text-gray-600" />
                      <span className="text-xs font-medium text-gray-700">{user.contactNumber}</span>
                    </div>
                  )}
                  {user?.location && (
                    <div className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-lg">
                      <MapPin className="h-3.5 w-3.5 text-gray-600" />
                      <span className="text-xs font-medium text-gray-700">{user.location}</span>
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={() => setShowEditModal(true)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg font-bold px-5 py-2 rounded-xl text-sm"
              >
                <Edit className="h-4 w-4 mr-1.5" />
                Edit Profile
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="bg-orange-500 p-2 rounded-lg shadow-sm">
                    <PawPrint className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700">Total Pets</span>
                </div>
                <p className="text-2xl font-black text-gray-900">{myPets.length + pendingPets.length}</p>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="bg-yellow-500 p-2 rounded-lg shadow-sm">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700">Stories</span>
                </div>
                <p className="text-2xl font-black text-gray-900">{myStories.length}</p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-pink-100 rounded-xl p-4 border border-red-200">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="bg-red-500 p-2 rounded-lg shadow-sm">
                    <Heart className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700">Favorites</span>
                </div>
                <p className="text-2xl font-black text-gray-900">{myFavorites.length}</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="bg-blue-500 p-2 rounded-lg shadow-sm">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700">Pending</span>
                </div>
                <p className="text-2xl font-black text-gray-900">{pendingPets.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-6 overflow-hidden">
          <div className="flex overflow-x-auto scrollbar-hide">
            {[
              { id: "pets" as TabType, label: "My Pets", count: myPets.length, icon: PawPrint, gradient: "from-orange-500 to-orange-600" },
              { id: "stories" as TabType, label: "Stories", count: myStories.length, icon: Star, gradient: "from-yellow-500 to-yellow-600" },
              { id: "favorites" as TabType, label: "Favorites", count: myFavorites.length, icon: Heart, gradient: "from-red-500 to-pink-600" },
              { id: "pending" as TabType, label: "Pending", count: pendingPets.length, icon: Clock, gradient: "from-blue-500 to-blue-600" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[120px] px-4 py-4 font-bold transition-all flex items-center justify-center gap-2 relative text-sm ${
                  activeTab === tab.id
                    ? "text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {activeTab === tab.id && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${tab.gradient}`}></div>
                )}
                <div className="relative flex items-center gap-2">
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === tab.id 
                      ? "bg-white/20 text-white" 
                      : "bg-gray-200 text-gray-700"
                  }`}>
                    {tab.count}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>
              <p className="text-gray-600 font-semibold mt-3 text-sm">Loading your content...</p>
            </div>
          </div>
        ) : (
          <div>
            {activeTab === "pets" && (
              <div>
                {myPets.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 mb-4">
                      <PawPrint className="h-8 w-8 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">No Pets Posted Yet</h3>
                    <p className="text-gray-600 mb-6 text-sm max-w-md mx-auto">
                      Start helping pets find their forever homes by posting your first adoption listing
                    </p>
                    <Link to="/add-pet">
                      <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg px-6 py-2.5 text-sm font-bold">
                        <PawPrint className="h-4 w-4 mr-2" />
                        Add Your First Pet
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {myPets.map((pet) => renderPetCard(pet, handleDeletePet))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "stories" && (
              <div>
                {myStories.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-200 mb-4">
                      <Star className="h-8 w-8 text-yellow-600" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">No Success Stories Yet</h3>
                    <p className="text-gray-600 mb-6 text-sm max-w-md mx-auto">
                      Share your heartwarming adoption journey and inspire others
                    </p>
                    <Link to="/success-stories/add">
                      <Button className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-lg px-6 py-2.5 text-sm font-bold">
                        <Star className="h-4 w-4 mr-2" />
                        Share Your Story
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {myStories.map(renderStoryCard)}
                  </div>
                )}
              </div>
            )}

            {activeTab === "favorites" && (
              <div>
                {myFavorites.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-red-100 to-pink-200 mb-4">
                      <Heart className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">No Favorites Yet</h3>
                    <p className="text-gray-600 mb-6 text-sm max-w-md mx-auto">
                      Start saving pets you're interested in to view them later
                    </p>
                    <Link to="/pets">
                      <Button className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg px-6 py-2.5 text-sm font-bold">
                        <Heart className="h-4 w-4 mr-2" />
                        Browse Pets
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {myFavorites.map((pet) => renderPetCard(pet, handleRemoveFavorite))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "pending" && (
              <div>
                {pendingPets.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 mb-4">
                      <Clock className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">No Pending Posts</h3>
                    <p className="text-gray-600 text-sm">All your posts are approved or you haven't posted yet</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {pendingPets.map((pet) => renderPetCard(pet, handleDeletePet))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-3xl sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black flex items-center gap-2">
                  <Edit className="h-6 w-6" />
                  Edit Profile
                </h2>
                <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-28 h-28 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-500 text-3xl font-bold overflow-hidden shadow-lg">
                    {previewImage || user?.profilePicture ? (
                      <img src={previewImage || user?.profilePicture || ""} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      getUserInitials()
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-2.5 cursor-pointer hover:shadow-lg transition-all shadow-md">
                    <Camera className="h-5 w-5" />
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Contact Number</label>
                <input
                  type="text"
                  value={editForm.contactNumber}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, contactNumber: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  variant="outline"
                  className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-bold"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-xl font-bold shadow-lg">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-[60] animate-in slide-in-from-top-5">
          <div
            className={`rounded-xl border-2 px-5 py-3 shadow-2xl text-sm font-bold ${
              toast.type === "success"
                ? "border-green-500 bg-green-50 text-green-800"
                : "border-red-500 bg-red-50 text-red-700"
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

export default UserProfile;

