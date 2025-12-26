import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { Button } from "../components/button";
import { getPendingPosts, approvePetPost } from "../services/admin";
import {
  Shield,
  LogOut,
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  Mail,
  Phone,
  X,
  DollarSign,
  User as UserIcon,
} from "lucide-react";

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
  age: PetAge;
  gender: string;
  description: string;
  imageUrl: string;
  adoptionType: "Free" | "Paid";
  price?: number;
  location: string;
  status: "Available" | "Adopted" | "Pending";
  postStatus: "Pending" | "Approved";
  createdAt?: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [pendingPosts, setPendingPosts] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedPost, setSelectedPost] = useState<Pet | null>(null);

  useEffect(() => {
    // Backend field is `role` (array), values are lowercase: "user" | "admin"
    if (!user || !(user.role || []).includes("admin")) {
      navigate("/login", { replace: true });
      return;
    }
    fetchPendingPosts();
  }, [user, navigate]);

  const fetchPendingPosts = async () => {
    try {
      setLoading(true);
      const response = await getPendingPosts(1, 100);
      setPendingPosts(response.data || []);
    } catch (err: any) {
      console.error("Failed to fetch pending posts:", err);
      showToast(
        "error",
        err?.code === "ERR_NETWORK"
          ? "Cannot reach backend. Please ensure the server is running."
          : "Failed to load pending posts"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (postId: string) => {
    setApproving((prev) => ({ ...prev, [postId]: true }));
    try {
      await approvePetPost(postId);
      setPendingPosts((prev) => prev.filter((p) => p._id !== postId));
      setSelectedPost(null); // Close modal after approval
      showToast("success", "Post approved successfully");
    } catch (err: any) {
      console.error("Failed to approve post:", err);
      showToast(
        "error",
        err?.code === "ERR_NETWORK"
          ? "Cannot reach backend. Please ensure the server is running."
          : "Failed to approve post"
      );
    } finally {
      setApproving((prev) => ({ ...prev, [postId]: false }));
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

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 3000);
  };

  const capitalize = (str: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const formatAge = (age: PetAge) => {
    if (!age || !age.value) return "Unknown";
    const unit = age.unit === "Months" || age.unit === "Years" ? age.unit : "Years";
    return `${age.value} ${age.value === 1 ? unit.slice(0, -1) : unit}`;
  };

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return "Just now";
    const now = new Date();
    const posted = new Date(dateString);
    const diffInDays = Math.floor((now.getTime() - posted.getTime()) / 86400000);
    if (diffInDays < 1) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return `${Math.floor(diffInDays / 7)} weeks ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-50 to-orange-100">
      {/* Admin Header */}
      <nav className="sticky top-0 z-50 bg-white shadow-lg border-b-4 border-orange-500">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-2 rounded-xl">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900">Admin Dashboard</h1>
                <p className="text-xs text-gray-500">AdoptSmart Management</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-2 border-red-500 text-red-600 hover:bg-red-50 gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Stats Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-4 rounded-xl">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-gray-900">{pendingPosts.length}</h2>
                <p className="text-gray-600 font-medium">Pending Approvals</p>
              </div>
            </div>
            <Button
              onClick={fetchPendingPosts}
              disabled={loading}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Pending Posts Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-semibold">Loading pending posts...</p>
            </div>
          </div>
        ) : pendingPosts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-16 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">All Caught Up!</h3>
            <p className="text-gray-600">No pending posts to review at the moment.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pendingPosts.map((pet) => (
              <div
                key={pet._id}
                onClick={() => setSelectedPost(pet)}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer hover:scale-105"
              >
                <div className="aspect-[4/3] overflow-hidden bg-gray-100 relative">
                  <img
                    src={pet.imageUrl || "/placeholder-pet.jpg"}
                    alt={pet.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder-pet.jpg";
                    }}
                  />
                  {pet.adoptionType === "Paid" && pet.price && (
                    <div className="absolute top-3 left-3 bg-green-600 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                      LKR {pet.price.toLocaleString()}
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-yellow-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Pending
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">{capitalize(pet.name)}</h3>
                    <div className="flex gap-2 flex-wrap">
                      <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                        {capitalize(pet.species)}
                      </span>
                      <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                        {capitalize(pet.breed)}
                      </span>
                      <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                        {formatAge(pet.age)}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2">{pet.description}</p>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <UserIcon className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">{pet.ownerId.username}</span>
                  </div>

                  <div className="text-center pt-2">
                    <p className="text-xs text-gray-500 font-medium">Click to view details & approve</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">Pending Post Review</h2>
                  <p className="text-orange-100 text-sm">Review details before approval</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-white hover:bg-white/20 p-2 rounded-xl transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Pet Image */}
              <div className="aspect-video w-full overflow-hidden rounded-2xl bg-gray-100 relative">
                <img
                  src={selectedPost.imageUrl || "/placeholder-pet.jpg"}
                  alt={selectedPost.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder-pet.jpg";
                  }}
                />
                {selectedPost.adoptionType === "Paid" && selectedPost.price && (
                  <div className="absolute top-4 left-4 bg-green-600 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    LKR {selectedPost.price.toLocaleString()}
                  </div>
                )}
              </div>

              {/* Pet Details */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-3xl font-black text-gray-900 mb-3">
                      {capitalize(selectedPost.name)}
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                      <span className="bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg text-sm font-bold">
                        {capitalize(selectedPost.species)}
                      </span>
                      <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-bold">
                        {capitalize(selectedPost.breed)}
                      </span>
                      <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-bold">
                        {formatAge(selectedPost.age)}
                      </span>
                      <span className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-bold">
                        {selectedPost.gender}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Description</h4>
                    <p className="text-gray-600 leading-relaxed">{selectedPost.description}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-gray-700">
                      <MapPin className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Location</p>
                        <p className="font-bold">{capitalize(selectedPost.location)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <Calendar className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Posted</p>
                        <p className="font-bold">{getTimeAgo(selectedPost.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Owner Details */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 space-y-4">
                  <h4 className="text-lg font-black text-gray-900 mb-4">Owner Information</h4>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      {selectedPost.ownerId.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-xl text-gray-900">{selectedPost.ownerId.username}</p>
                      <p className="text-sm text-gray-600">Pet Owner</p>
                    </div>
                  </div>

                  {selectedPost.ownerId.email && (
                    <div className="flex items-start gap-3 bg-white rounded-xl p-3">
                      <Mail className="h-5 w-5 text-orange-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-medium mb-1">Email</p>
                        <p className="text-sm text-gray-900 font-medium break-all">
                          {selectedPost.ownerId.email}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedPost.ownerId.contactNumber && (
                    <div className="flex items-start gap-3 bg-white rounded-xl p-3">
                      <Phone className="h-5 w-5 text-orange-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-medium mb-1">Contact Number</p>
                        <p className="text-sm text-gray-900 font-medium">
                          {selectedPost.ownerId.contactNumber}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedPost.ownerId.location && (
                    <div className="flex items-start gap-3 bg-white rounded-xl p-3">
                      <MapPin className="h-5 w-5 text-orange-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-medium mb-1">Owner Location</p>
                        <p className="text-sm text-gray-900 font-medium">
                          {capitalize(selectedPost.ownerId.location)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Approval Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  onClick={() => setSelectedPost(null)}
                  variant="outline"
                  className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 py-4 text-lg font-bold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleApprove(selectedPost._id)}
                  disabled={approving[selectedPost._id]}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 text-lg font-bold shadow-lg"
                >
                  {approving[selectedPost._id] ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-6 w-6 mr-2" />
                      Approve Post
                    </>
                  )}
                </Button>
              </div>
            </div>
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
    </div>
  );
};

export default Admin;

