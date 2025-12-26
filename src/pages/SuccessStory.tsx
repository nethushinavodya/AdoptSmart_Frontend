import { useEffect, useState } from "react";
import { Button } from "../components/button";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Home as HomeIcon,
  Star,
  User,
  LogOut,
  Menu,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { useAuth } from "../context/authContext";
import successBg from "../assets/success.png";
import {
  getAllSuccessStories,
  type ISuccessStory,
  type StoryOwner,
} from "../services/successStory";
import Footer from "../components/Footer";

const SuccessStory = () => {
  const [stories, setStories] = useState<ISuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentImageIndexes, setCurrentImageIndexes] = useState<{ [key: string]: number }>({});
  const [likedStories, setLikedStories] = useState<Set<string>>(new Set());
  const [dislikedStories, setDislikedStories] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<{ [key: string]: number }>({});
  const [dislikeCounts, setDislikeCounts] = useState<{ [key: string]: number }>({});
  const [showScrollButton, setShowScrollButton] = useState(false);

  const auth = useAuth();
  const user = auth?.user;
  const logout = auth?.logout ?? (async () => {});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSuccessStories = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching success stories...");
        const response = await getAllSuccessStories(1, 30);
        console.log("Success stories API response:", response);

        if (response && response.data && response.data.data) {
          console.log("Stories data:", response.data.data);
          setStories(response.data.data);

          const initialLikes: { [key: string]: number } = {};
          const initialDislikes: { [key: string]: number } = {};
          response.data.data.forEach((story: ISuccessStory) => {
            initialLikes[story._id] = 0;
            initialDislikes[story._id] = 0;
          });
          setLikeCounts(initialLikes);
          setDislikeCounts(initialDislikes);
        } else {
          console.warn("No data in response:", response);
          setStories([]);
        }
      } catch (err: any) {
        console.error("Error fetching success stories:", err);
        console.error("Error details:", {
          message: err?.message,
          response: err?.response,
          status: err?.response?.status
        });
        setStories([]);

        if (err?.code === "ERR_NETWORK" || err?.message?.includes("Network Error")) {
          setError("Cannot connect to server. Please ensure the backend is running on http://localhost:5000");
        } else if (err?.response?.status === 404) {
          setError("API endpoint not found. Check backend routes.");
        } else if (err?.response?.status === 500) {
          setError("Server error. Check backend logs.");
        } else {
          setError(err?.message || "Failed to load success stories.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSuccessStories();
  }, []);

  // Add scroll listener for floating button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
    if (diffInMinutes < 60)
      return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
    if (diffInHours < 24)
      return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
    if (diffInDays < 7)
      return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
    }
    const months = Math.floor(diffInDays / 30);
    return `${months} ${months === 1 ? "month" : "months"} ago`;
  };

  const nextImage = (storyId: string, totalImages: number) => {
    setCurrentImageIndexes((prev) => ({
      ...prev,
      [storyId]: ((prev[storyId] || 0) + 1) % totalImages,
    }));
  };

  const prevImage = (storyId: string, totalImages: number) => {
    setCurrentImageIndexes((prev) => ({
      ...prev,
      [storyId]: ((prev[storyId] || 0) - 1 + totalImages) % totalImages,
    }));
  };

  const getOwner = (userId: ISuccessStory["userId"]): StoryOwner | null => {
    if (!userId) return null;
    if (typeof userId === "string") {
      console.warn("userId is string, not populated:", userId);
      return null;
    }
    return userId;
  };

  const handleLike = (storyId: string) => {
    const wasLiked = likedStories.has(storyId);
    const wasDisliked = dislikedStories.has(storyId);

    setLikedStories((prev) => {
      const newSet = new Set(prev);
      if (wasLiked) {
        newSet.delete(storyId);
      } else {
        newSet.add(storyId);
      }
      return newSet;
    });

    setLikeCounts((counts) => ({
      ...counts,
      [storyId]: wasLiked ? counts[storyId] - 1 : (counts[storyId] || 0) + 1,
    }));

    if (wasDisliked) {
      setDislikedStories((prev) => {
        const newSet = new Set(prev);
        newSet.delete(storyId);
        return newSet;
      });
      setDislikeCounts((counts) => ({
        ...counts,
        [storyId]: counts[storyId] - 1,
      }));
    }
  };

  const handleDislike = (storyId: string) => {
    const wasLiked = likedStories.has(storyId);
    const wasDisliked = dislikedStories.has(storyId);

    setDislikedStories((prev) => {
      const newSet = new Set(prev);
      if (wasDisliked) {
        newSet.delete(storyId);
      } else {
        newSet.add(storyId);
      }
      return newSet;
    });

    setDislikeCounts((counts) => ({
      ...counts,
      [storyId]: wasDisliked ? counts[storyId] - 1 : (counts[storyId] || 0) + 1,
    }));

    if (wasLiked) {
      setLikedStories((prev) => {
        const newSet = new Set(prev);
        newSet.delete(storyId);
        return newSet;
      });
      setLikeCounts((counts) => ({
        ...counts,
        [storyId]: counts[storyId] - 1,
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-50 to-orange-200">
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
                className="flex items-center gap-2 text-orange-500 font-semibold transition-colors"
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
                  className="flex items-center gap-2 text-orange-500 font-semibold py-2"
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

      <div className="relative overflow-hidden h-[350px] md:h-[400px]">
        <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${successBg})`,
              backgroundSize: "cover",
              backgroundPosition: "center center",
            }}
        >
          <div className="absolute inset-0 bg-black/15"/>
          <div className="absolute inset-0 backdrop-blur-[2px]"/>

        </div>

        <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
          <div className="max-w-4xl mx-auto text-center w-full">
            <h1 className="text-4xl md:text-6xl font-black mb-5 text-gray-200 drop-shadow-lg leading-tight">
              Heartwarming
              <span className="block bg-gradient-to-r from-orange-400 via-orange-600 to-yellow-600 bg-clip-text text-transparent mt-2 animate-gradient bg-200%">
                Success Stories
              </span>
            </h1>

            <p className="text-base md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto font-semibold drop-shadow-sm leading-relaxed">
              Discover touching tales of rescued pets finding their forever families and bringing endless joy
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="rgb(255 247 237)" />
          </svg>
        </div>
      </div>

      <div className="container mx-auto px-6 md:px-8 lg:px-12 py-10 md:py-14">
        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p className="font-semibold mb-1">Error loading success stories</p>
            <p>{error}</p>
            <p className="mt-2 text-xs text-red-600">
              Expected endpoint: GET http://localhost:5000/api/v1/successStory/getAll
            </p>
          </div>
        )}

        <main className="px-2 md:px-0">
          {loading ? (
            <div className="space-y-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="overflow-hidden">
                  <div className={`grid md:grid-cols-2 gap-6 ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                    <div className="aspect-[4/3] bg-gradient-to-br from-orange-100 via-orange-200 to-orange-300 animate-pulse rounded-lg" />
                    <div className="space-y-4">
                      <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
                        <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
                        <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : stories.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md border border-orange-100 p-20 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 mb-6">
                <Star className="h-10 w-10 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">No success stories yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Be the first to share your heartwarming adoption story!
              </p>
              <Link to="/success-stories/add">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
                  <Plus className="h-5 w-5" />
                  Share Your Story
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-16">
              {stories.map((story, index) => {
                const currentIndex = currentImageIndexes[story._id] || 0;
                const owner = getOwner(story.userId);
                const isEven = index % 2 === 0;
                const isLiked = likedStories.has(story._id);
                const isDisliked = dislikedStories.has(story._id);
                const likeCount = likeCounts[story._id] || 0;
                const dislikeCount = dislikeCounts[story._id] || 0;

                return (
                  <div key={story._id}>
                    <div className="transition-all">
                      <div className={`grid md:grid-cols-5 gap-8 items-center ${!isEven ? 'md:flex-row-reverse' : ''}`}>
                        <div className={`relative md:col-span-2 ${!isEven ? 'md:order-2' : 'md:order-1'}`}>
                          <div className="aspect-[3/2] overflow-hidden bg-gray-100 relative rounded-xl shadow-lg">
                            <img
                              src={story.images[currentIndex] || "/placeholder-pet.jpg"}
                              alt={`${story.title} - Image ${currentIndex + 1}`}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder-pet.jpg";
                              }}
                            />

                            {story.images.length > 1 && (
                              <>
                                <button
                                  onClick={() => prevImage(story._id, story.images.length)}
                                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-all shadow-lg"
                                >
                                  <ChevronLeft className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => nextImage(story._id, story.images.length)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-all shadow-lg"
                                >
                                  <ChevronRight className="h-5 w-5" />
                                </button>

                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                  {story.images.map((_, idx) => (
                                    <div
                                      key={idx}
                                      className={`h-2 rounded-full transition-all ${
                                        idx === currentIndex
                                          ? "w-6 bg-white"
                                          : "w-2 bg-white/50"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <div className={`md:col-span-3 flex flex-col justify-center ${!isEven ? 'md:order-1' : 'md:order-2'}`}>
                          <div className="space-y-6">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                              {story.title}
                            </h2>

                            <p className="text-lg text-gray-700 leading-relaxed">
                              {story.description}
                            </p>

                            <div className="flex items-center gap-3 pt-2">
                              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden">
                                {owner?.profilePicture ? (
                                  <img
                                    src={owner.profilePicture}
                                    alt={owner.username}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <User className="h-6 w-6 text-orange-600" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">
                                  {owner?.username || "Anonymous"}
                                </p>
                                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                  <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  <span>{getTimeAgo(story.createdAt)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                              <button
                                onClick={() => handleLike(story._id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
                                  isLiked
                                    ? "bg-orange-500 text-white shadow-md"
                                    : "bg-gray-100 text-gray-700 hover:bg-orange-100"
                                }`}
                              >
                                <ThumbsUp className={`h-5 w-5 ${isLiked ? 'fill-white' : ''}`} />
                                <span className="font-semibold">{likeCount}</span>
                              </button>
                              <button
                                onClick={() => handleDislike(story._id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
                                  isDisliked
                                    ? "bg-red-500 text-white shadow-md"
                                    : "bg-gray-100 text-gray-700 hover:bg-red-100"
                                }`}
                              >
                                <ThumbsDown className={`h-5 w-5 ${isDisliked ? 'fill-white' : ''}`} />
                                <span className="font-semibold">{dislikeCount}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {index < stories.length - 1 && (
                      <div className="mt-16 mb-0">
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t-2 border-gray-200"></div>
                          </div>
                          <div className="relative flex justify-center">
                            <span className="bg-gradient-to-br from-orange-50 via-white to-orange-50 px-6 py-2">
                              <Star className="h-6 w-6 text-orange-400" />
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <Link to="/success-stories/add">
        <button
          className={`fixed bottom-8 right-8 bg-orange-500 hover:bg-orange-600 text-white rounded-full p-3 shadow-2xl transition-all duration-300 z-50 group ${
            showScrollButton ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          }`}
          aria-label="Add Success Story"
        >
          <Plus className="h-5 w-5" />
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Share Your Story
          </span>
        </button>
      </Link>

      {!showScrollButton && (
        <Link to="/success-stories/add">
          <button
            className="fixed bottom-8 right-8 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full px-5 py-2.5 shadow-2xl transition-all duration-300 z-50 flex items-center gap-2 group hover:scale-105"
            aria-label="Add Success Story"
          >
            <Plus className="h-5 w-5" />
            <span className="font-semibold text-sm">Add Story</span>
          </button>
        </Link>
      )}

      <Footer />
    </div>
  );
};

export default SuccessStory;

