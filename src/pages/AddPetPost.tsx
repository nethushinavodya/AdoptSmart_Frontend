import { useState, useEffect } from "react";
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
  Upload,
  MapPin,
  DollarSign,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../context/authContext";
import { createPetPost, type PetInput } from "../services/petPost";
import Footer from "../components/Footer";

type AgeUnit = "Months" | "Years";

const AddPetPost = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<PetInput>({
    name: "",
    species: "",
    breed: "",
    age: {
      value: 0,
      unit: "Years",
    },
    gender: "",
    description: "",
    adoptionType: "Free",
    price: undefined,
    contactInfo: "",
    location: "",
    status: "Available",
  });

  const [ageUnit, setAgeUnit] = useState<AgeUnit>("Years");

  useEffect(() => {
    if (user?.contactNumber || user?.email) {
      setFormData((prev) => ({
        ...prev,
        contactInfo: user.contactNumber || user.email || "",
      }));
    }
  }, [user]);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, image: "Image size should be less than 5MB" });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setErrors({ ...errors, image: "" });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "age") {
      setFormData((prev) => ({
        ...prev,
        age: {
          ...prev.age,
          value: Number(value),
        },
      }));
      setErrors({ ...errors, age: "" });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" ? Number(value) : value,
    }));
    setErrors({ ...errors, [name]: "" });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Pet name is required";
    if (!formData.species.trim()) newErrors.species = "Species is required";
    if (!formData.breed.trim()) newErrors.breed = "Breed is required";
    if (!(Number(formData.age.value) > 0)) newErrors.age = "Valid age is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!imageFile) newErrors.image = "Pet image is required";
    if (formData.adoptionType === "Paid" && (!formData.price || formData.price <= 0)) {
      newErrors.price = "Price is required for paid adoption";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const ageString = `${formData.age.value} ${ageUnit}`;

      const submissionData: PetInput = {
        ...formData,
        age: {
          value: formData.age.value,
          unit: ageUnit,
        },
        ageDisplay: ageString,
      };

      await createPetPost(submissionData, imageFile!);
      alert("Pet post created successfully!");
      navigate("/pets");
    } catch (error: any) {
      console.error("Error creating pet post:", error);
      alert(
        error?.response?.data?.message ||
          "Failed to create pet post. Please try again."
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
          Back to Pets
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            List a Pet for <span className="text-orange-500">Adoption</span>
          </h1>
          <p className="text-gray-600">Help a pet find their forever home by creating a detailed listing</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg border border-orange-100 p-4 md:p-6"
        >
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Pet Photo *
            </label>
            <div className="flex flex-col items-center">
              <div className="w-full max-w-md">
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-orange-300 rounded-xl cursor-pointer bg-orange-50 hover:bg-orange-100 transition-colors"
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-12 h-12 text-orange-400 mb-3" />
                      <p className="mb-2 text-sm text-gray-600">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG (MAX. 5MB)</p>
                    </div>
                  )}
                  <input
                    id="image-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
                {errors.image && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.image}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Pet Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="e.g., Buddy"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Species *
              </label>
              <select
                name="species"
                value={formData.species}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Select species</option>
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Bird">Bird</option>
                <option value="Rabbit">Rabbit</option>
                <option value="Other">Other</option>
              </select>
              {errors.species && <p className="mt-1 text-sm text-red-600">{errors.species}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Breed *
              </label>
              <input
                type="text"
                name="breed"
                value={formData.breed}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="e.g., Golden Retriever"
              />
              {errors.breed && <p className="mt-1 text-sm text-red-600">{errors.breed}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Age *
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="age"
                  value={formData.age.value || ""}
                  onChange={handleInputChange}
                  min="0"
                  step="1"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., 2"
                />
                <select
                  value={ageUnit}
                  onChange={(e) => setAgeUnit(e.target.value as AgeUnit)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="Months">Months</option>
                  <option value="Years">Years</option>
                </select>
              </div>
              {errors.age && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.age}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Gender *
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="e.g., Colombo, Sri Lanka"
              />
              {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Tell us about this pet's personality, health, and why they need a new home..."
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Adoption Type *
              </label>
              <select
                name="adoptionType"
                value={formData.adoptionType}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="Free">Free Adoption</option>
                <option value="Paid">Paid Adoption</option>
              </select>
            </div>

            {formData.adoptionType === "Paid" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <DollarSign className="inline h-4 w-4 mr-1" />
                  Price (LKR) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price || ""}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., 50000"
                />
                {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contact Info (Optional)
              </label>
              <input
                type="text"
                name="contactInfo"
                value={formData.contactInfo}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="e.g., +94 77 123 4567"
              />
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
                  Creating Post...
                </>
              ) : (
                <>
                  <PawPrint className="h-5 w-5 mr-2" />
                  Create Pet Post
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/pets")}
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

export default AddPetPost;

