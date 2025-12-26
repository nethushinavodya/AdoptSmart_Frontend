import { useState, useEffect, useRef } from "react";
import { Button } from "../components/button";
import { Link, useNavigate } from "react-router-dom";
import {
  Home as HomeIcon,
  Search,
  Star,
  User,
  LogOut,
  Menu,
  X,
  PawPrint,
  AlertCircle,
  ArrowLeft,
  X as CloseIcon,
  ImagePlus,
} from "lucide-react";
import { useAuth } from "../context/authContext";
import { createSuccessStory } from "../services/successStory";
import Footer from "../components/Footer";

const AddSuccessStory = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

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

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const combined = [...imageFiles, ...selected];

    if (combined.length > 4) {
      setErrors({
        images: "You can upload minimum 1 and maximum 4 images.",
      });
      return;
    }

    const oversized = selected.find((f) => f.size > 5 * 1024 * 1024);
    if (oversized) {
      setErrors({ images: "Each image must be less than 5MB." });
      return;
    }

    imagePreviews.forEach((url) => URL.revokeObjectURL(url));

    const newPreviewUrls = combined.map((file) =>
      URL.createObjectURL(file)
    );

    setImageFiles(combined);
    setImagePreviews(newPreviewUrls);
    setErrors((prev) => ({ ...prev, images: "" }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    const newFiles = [...imageFiles];
    const newPreviews = [...imagePreviews];
    const [removedPreview] = newPreviews.splice(index, 1);
    newFiles.splice(index, 1);
    if (removedPreview) URL.revokeObjectURL(removedPreview);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Title is required";
    if (!description.trim()) newErrors.description = "Description is required";
    if (imageFiles.length < 1 || imageFiles.length > 4) {
      newErrors.images = "You can upload minimum 1 and maximum 4 images.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await createSuccessStory({
        title: title.trim(),
        description: description.trim(),
        images: imageFiles,
      });
      alert("Success story created successfully!");
      navigate("/success-stories");
    } catch (error: any) {
      console.error("Error creating success story:", error);
      alert(
        error?.response?.data?.message ||
          "Failed to create success story. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      <nav className="sticky top-0 z-50 bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow"
              >
                <path
                  d="M12 13c-2.5 0-4.5 1.5-4.5 3.5S9.5 20 12 20s4.5-1.5 4.5-3.5S14.5 13 12 13z"
                  fill="#FB923C"
                />
                <path
                  d="M6.2 8.7c.9-.9 2.6-1.1 3.6-.4.9.7 1.2 2 .3 2.9-.9.9-2.6 1.1-3.6.4-.9-.7-1.2-2-.3-2.9z"
                  fill="#FB923C"
                />
                <path
                  d="M17.8 8.7c-.9-.9-2.6-1.1-3.6-.4-.9.7-1.2 2-.3 2.9.9.9 2.6 1.1 3.6.4.9-.7 1.2-2 .3-2.9z"
                  fill="#FB923C"
                />
                <path
                  d="M8.2 4.6c.6-.8 1.9-1.1 2.8-.6.9.5 1.3 1.6.7 2.4-.6.8-1.9 1.1-2.8.6-.9-.5-1.3-1.6-.7-2.4z"
                  fill="#FB923C"
                />
                <path
                  d="M15.8 4.6c-.6-.8-1.9-1.1-2.8-.6-.9.5-1.3 1.6-.7 2.4.6.8 1.9 1.1 2.8.6.9-.5 1.3-1.6.7-2.4z"
                  fill="#FB923C"
                />
              </svg>
              <div>
                <div className="text-xl font-bold text-orange-500">
                  AdoptSmart
                </div>
                <div className="text-xs text-gray-500 -mt-1">
                  Find your new best friend
                </div>
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
                className="flex items-center gap-2 text-gray-700 hover:text-orange-500 transition-colors font-medium"
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
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg:white text-orange-500 font-semibold bg-white">
                  {getUserInitials()}
                </div>
                <span className="font-medium">
                  {user?.username || "User"}
                </span>
              </button>

              {showProfileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 rounded-lg bg:white shadow-xl border border-gray-200 z-20 bg-white">
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
              {showMobileMenu ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
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
                  className="flex items-center gap-2 text-gray-700 hover:text-orange-500 py-2"
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

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Button
          onClick={() => navigate(-1)}
          variant="outline"
          className="mb-6 gap-2 border-2 border-orange-500 text-orange-600 hover:bg-orange-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Success Stories
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Share Your <span className="text-orange-500">Success Story</span>
          </h1>
          <p className="text-gray-600">
            Inspire others by sharing how your pet found a loving home.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg border border-orange-100 p-4 md:p-6"
        >
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Story Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors((prev) => ({ ...prev, title: "" }));
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., How Bella Found Her Forever Home"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Story *
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setErrors((prev) => ({ ...prev, description: "" }));
              }}
              rows={5}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Describe how you adopted your pet and how life has changed since..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description}
              </p>
            )}
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-700">
                Photos (1–4) *
              </label>
              <span className="text-xs text-gray-500">
                {imageFiles.length}/4 selected
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {imagePreviews.length > 0 ? (
                  imagePreviews.map((src, idx) => (
                    <div
                      key={idx}
                      className="relative w-24 h-24 rounded-lg overflow-hidden border border-orange-200 bg-gray-50"
                    >
                      <img
                        src={src}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                      >
                        <CloseIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center text-sm text-gray-500">
                    No photos selected yet
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 border-dashed border-orange-300 text-orange-600 hover:bg-orange-50"
                >
                  <ImagePlus className="h-4 w-4" />
                  Add Photos
                </Button>
                <span className="text-xs text-gray-500">
                  PNG, JPG • Max 5MB each
                </span>
              </div>

              <input
                ref={fileInputRef}
                id="story-images-upload"
                type="file"
                multiple
                className="hidden"
                accept="image/*"
                onChange={handleImagesChange}
              />

              {errors.images && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.images}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Publishing Story...
                </>
              ) : (
                <>
                  <PawPrint className="h-5 w-5 mr-2" />
                  Publish Story
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/success-stories")}
              className="px-8 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default AddSuccessStory;

