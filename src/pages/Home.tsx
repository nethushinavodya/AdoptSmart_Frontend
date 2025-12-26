import { useEffect, useState } from "react";
import { Button } from "../components/button";
import { Link, useNavigate } from "react-router-dom";
import {
  Heart,
  Search,
  PawPrint,
  ArrowRight,
  MapPin,
  Home as HomeIcon,
  Star,
  User,
  LogOut,
  Menu,
  X,
  CheckCircle,
  MessageCircle,
  Shield
} from "lucide-react";
import { getApprovedPetPosts } from "../services/petPost.ts";
import { useAuth } from "../context/authContext";
import heroImage from "../assets/hero-pets.jpg";
import Footer from "../components/Footer";

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
  owner?: {
    username: string;
    name?: string;
    contactNumber?: string;
  };
  name: string;
  species: string;
  breed: string;
  age: number;
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

const Home = () => {
  const [featuredPets, setFeaturedPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const response = await getApprovedPetPosts(1, 8);
        console.log("API Response:", response.data);

        const rawPets =
          response.data?.data ||
          response.data?.petPosts ||
          response.data ||
          [];

        const pets: Pet[] = (rawPets as any[]).map((p) => ({
          ...p,
          ownerId: p.ownerId,
          owner: {
            username: p.ownerId?.username ?? "Unknown",
            contactNumber:
              p.ownerId?.contactNumber ?? p.contactInfo ?? undefined,
          },
        }));

        const availablePets = pets.filter(pet => pet.status === "Available");
        const limitedPets = availablePets.slice(0, 8);

        console.log("Mapped Pets data:", limitedPets);
        setFeaturedPets(limitedPets);
      } catch (error) {
        console.error("Error fetching pets:", error);
        setFeaturedPets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPets();
  }, []);

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
    if (diffInMinutes < 60) return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    if (diffInHours < 24) return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffInDays < 7) return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} ${Math.floor(diffInDays / 7) === 1 ? 'week' : 'weeks'} ago`;
    return `${Math.floor(diffInDays / 30)} ${Math.floor(diffInDays / 30) === 1 ? 'month' : 'months'} ago`;
  };

  const capitalize = (str: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-orange-50">
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
                  to="/"
                  className="flex items-center gap-2 text-orange-500 font-semibold transition-colors"
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

            <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-gray-700 hover:text-orange-500"
            >
              {showMobileMenu ? <X className="h-6 w-6"/> : <Menu className="h-6 w-6"/>}
            </button>
          </div>

          {showMobileMenu && (
              <div className="md:hidden border-t border-gray-200 py-4">
                <div className="flex flex-col gap-4">
                  <Link
                      to="/"
                      className="flex items-center gap-2 text-orange-500 font-semibold py-2"
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

      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-white min-h-screen flex items-center">
        <div className="absolute inset-0">
          <img
              src={heroImage}
              alt="Happy pets looking for homes"
              className="h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-orange-50/90" />
        </div>

        <div className="container relative mx-auto px-4 md:px-6 lg:px-8 pb-12 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-left space-y-6">
              <div
                  className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-600 border border-orange-200 shadow-sm">
                <Heart className="h-4 w-4 fill-orange-500"/>
                <span>Welcome back, {user?.name?.split(" ")[0] || "Friend"}!</span>
              </div>

              <h1 className="text-4xl font-extrabold leading-tight text-gray-900 md:text-5xl lg:text-6xl">
                Find Your Perfect{" "}
                <span className="text-orange-500 relative">
                Companion
                <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 200 12" fill="none">
                  <path d="M2 10C50 2 150 2 198 10" stroke="#FB923C" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                </span>
              </h1>

              <p className="text-lg text-gray-600 md:text-xl max-w-xl leading-relaxed">
                Browse through our collection of adorable pets waiting for their forever homes.
                Each pet deserves love, care, and a family to call their own.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row pt-4">
                <Link to="/pets">
                  <Button size="lg"
                          className="gap-2 bg-orange-500 text-white hover:bg-orange-600 font-semibold shadow-lg hover:shadow-xl w-full sm:w-auto">
                    <Search className="h-5 w-5"/>
                    Browse All Pets
                  </Button>
                </Link>
                <Link to="/add-pet">
                  <Button size="lg" variant="outline"
                          className="gap-2 border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold w-full sm:w-auto">
                    <PawPrint className="h-5 w-5"/>
                    Add a Pet
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500">500+</div>
                  <div className="text-sm text-gray-600 mt-1">Pets Adopted</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500">1.2K+</div>
                  <div className="text-sm text-gray-600 mt-1">Happy Families</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500">98%</div>
                  <div className="text-sm text-gray-600 mt-1">Success Rate</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-6">
                <div
                    className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
                  <CheckCircle className="h-5 w-5 text-green-500"/>
                  <span className="text-sm font-medium text-gray-700">Verified Listings</span>
                </div>
                <div
                    className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
                  <Shield className="h-5 w-5 text-blue-500"/>
                  <span className="text-sm font-medium text-gray-700">Safe & Secure</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div
                  className="absolute -top-6 -right-6 w-72 h-72 bg-orange-200 rounded-full opacity-20 blur-3xl"></div>
              <div
                  className="absolute -bottom-6 -left-6 w-64 h-64 bg-yellow-200 rounded-full opacity-20 blur-3xl"></div>
              <img
                  src={heroImage}
                  alt="Adorable pets"
                  className="relative rounded-3xl shadow-2xl border-8 border-white w-full h-[400px] lg:h-[500px] object-cover"
              />
              <div
                  className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-lg p-4 border border-orange-100 max-w-[200px]">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 rounded-full p-3">
                    <Heart className="h-6 w-6 text-orange-500 fill-orange-500"/>
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">Find Love Today</div>
                    <div className="text-sm text-gray-500">Start your journey</div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -left-4 bg-white rounded-2xl shadow-lg p-4 border border-orange-100">
                <div className="flex items-center gap-2">
                  <PawPrint className="h-5 w-5 text-orange-500"/>
                  <div className="text-sm font-semibold text-gray-800">500+ Pets Available</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-gradient-to-br from-white to-orange-100">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl text-gray-800">
              Meet Our <span className="text-orange-500">Adorable Pets</span>
            </h2>
            <p className="mx-auto max-w-2xl text-gray-600">
              Featured pets waiting for loving homes. Browse more pets by clicking "View All Pets" below.
            </p>
          </div>

          {loading ? (
              <div className="text-center py-12">
                <div
                    className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading pets...</p>
              </div>
          ) : featuredPets.length === 0 ? (
              <div className="text-center py-12">
                <PawPrint className="mx-auto h-12 w-12 text-gray-400 mb-4"/>
                <p className="text-gray-600 mb-4">No pets available at the moment.</p>
                <Link to="/add-pet">
                  <Button className="gap-2 bg-orange-500 hover:bg-orange-600 text-white">
                    <PawPrint className="h-5 w-5"/>
                    Be the First to Add a Pet
                  </Button>
                </Link>
              </div>
          ) : (
              <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 px-4 md:px-6">
                {featuredPets.slice(0, 4).map((pet) => (
                    <div key={pet._id} className="group overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-xl border border-orange-100 hover:border-orange-200">
                      <div className="aspect-[16/9] overflow-hidden bg-gray-100 relative">
                        <img
                            src={pet.imageUrl || "/placeholder-pet.jpg"}
                            alt={pet.name}
                            className="h-full w-full object-cover transition-transform group-hover:scale-110"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/placeholder-pet.jpg";
                            }}
                        />
                        <div className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md">
                          <Heart
                              className="h-4 w-4 text-gray-400 hover:text-orange-500 hover:fill-orange-500 transition-colors cursor-pointer"/>
                        </div>
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
                ))}
              </div>
          )}

          <div className="text-center">
            <Link to="/pets">
              <Button variant="outline" size="lg"
                      className="gap-2 border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold shadow-md hover:shadow-lg">
                View All Pets
                <ArrowRight className="h-4 w-4"/>
              </Button>
            </Link>
            <p className="mt-4 text-sm text-gray-500">
              Showing {featuredPets.length} featured pets. Click to see all available pets.
            </p>
          </div>
        </div>
      </section>

       <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl text-gray-800">
              How <span className="text-orange-500">AdoptSmart</span> Works
            </h2>
            <p className="mx-auto max-w-2xl text-gray-600">
              Finding your new furry friend is easy with our simple adoption process.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                icon: Search,
                title: "Browse Pets",
                description:
                    "Explore our listings of adorable pets looking for homes. Filter by species, age, location, and more.",
                color: "bg-orange-100 text-orange-500"
              },
              {
                step: "02",
                icon: MessageCircle,
                title: "Connect",
                description:
                    "Found your perfect match? Contact the owner directly to learn more about the pet and arrange a meeting.",
                color: "bg-blue-100 text-blue-500"
              },
              {
                step: "03",
                icon: Heart,
                title: "Adopt & Love",
                description:
                    "Complete the adoption process and welcome your new family member home! Share your story with our community.",
                color: "bg-pink-100 text-pink-500"
              },
            ].map((item, index) => (
                <div
                    key={index}
                    className="rounded-2xl bg-gradient-to-br from-orange-50 to-white p-8 transition-all hover:shadow-lg border border-orange-100 relative overflow-hidden"
                >
                  <div
                      className="absolute top-0 right-0 text-[120px] font-bold text-orange-100 leading-none -mt-8 -mr-8">
                    {item.step}
                  </div>
                  <div
                      className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${item.color} relative z-10`}>
                    <item.icon className="h-6 w-6"/>
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-gray-800 relative z-10">{item.title}</h3>
                  <p className="text-gray-600 relative z-10">{item.description}</p>
                </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-gradient-to-br from-gray-50 to-orange-200 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold md:text-4xl text-gray-900 mb-4">
              Make a <span className="text-orange-500">Difference</span> Today
            </h2>
            <p className="mx-auto max-w-2xl text-gray-600 text-lg">
              Join our community of pet lovers and help create happy endings
            </p>
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Add Pet Card */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
              <div className="p-8">
                <div className="bg-orange-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <PawPrint className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  List a Pet for Adoption
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Have a pet that needs a loving home? Create a listing and help them find their perfect family match.
                </p>
                <Link to="/add-pet">
                  <Button
                    size="lg"
                    className="w-full gap-2 bg-orange-500 text-white hover:bg-orange-600 font-semibold shadow-md hover:shadow-lg group-hover:scale-105 transition-all"
                  >
                    <PawPrint className="h-5 w-5" />
                    Add a Pet
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Success Stories Card */}
            <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
              <div className="p-8">
                <div className="bg-yellow-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Share Your Success Story
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Adopted through AdoptSmart? Share your heartwarming journey and inspire others to adopt.
                </p>
                <Link to="/success-stories">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full gap-2 border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold group-hover:scale-105 transition-all"
                  >
                    <Star className="h-5 w-5" />
                    Read Stories
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-2 bg-white rounded-full px-6 py-3 shadow-md border border-gray-200">
              <Heart className="h-5 w-5 text-orange-500 fill-orange-500" />
              <span className="text-gray-700 font-medium">
                Join <span className="font-bold text-orange-500">1,200+</span> families who found their perfect pet
              </span>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Home;
