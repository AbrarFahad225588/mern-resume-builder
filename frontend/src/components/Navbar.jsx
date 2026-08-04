import { useNavigate, Link } from "react-router-dom";
import { useResume } from "../contex/ResumeContex";
import {
  FaEdit,
  FaFileAlt,
  FaHome,
  FaPalette,
  FaSignOutAlt,
  FaUser,
  FaUserCircle,
  FaUserPlus,
} from "react-icons/fa";

const Navbar = () => {
  const navigate = useNavigate();
  const { logout, isAuthenticated, user } = useResume();
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white/90 background-blur-md border-b border-slate-200/80 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-linear-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-xl">R</span>
          </div>
          <span className="text-xl font-black text-slate-800 tracking-tight">
            Resume<span className="text-blue-600">Forge</span>
          </span>
        </Link>
        <div className="flex items-center gap-1 md:gap-2">
          <Link to="/">
            <span className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl font-semibold text-sm hover:bg-slate-100 hover:text-slate-900 transition-all duration-200">
              <FaHome className="text-lg" />
              <span className="hidden sm:inline">Home</span>
            </span>
          </Link>
          <Link to="/templates">
            <span className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl font-semibold text-sm hover:bg-slate-100 hover:text-slate-900 transition-all duration-200">
              <FaPalette className="text-lg" />
              <span className="hidden sm:inline">Templates</span>
            </span>
          </Link>
          {isAuthenticated && (
            <>
              {/* Must be the absolute "/my-resumes": the previous value was
                  relative AND singular, so it resolved against the current URL
                  and fell through to the not-found route. */}
              <Link
                to="/my-resumes"
                className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl font-semibold text-sm text-slate-600
  hover:bg-slate-100 hover:text-slate-900 transition-all duration-200"
              >
                <FaFileAlt className="text-lg" />
                <span className="hidden sm:inline">My Resumes</span>
              </Link>
              {/* No ?template= here, so the editor falls back to the default
                  design; the picker in the editor can change it afterwards. */}
              <Link
                to="/editor/new"
                className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl font-semibold text-sm bg-blue-600
  text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all duration-200"
              >
                <FaEdit className="text-lg" />
                <span className="hidden sm:inline">New Resume</span>
              </Link>
            </>
          )}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-slate-600">
                <FaUserCircle className="text-lg" />
                <span className="hidden md:inline text-sm font-medium">
                  {user?.name || "User"}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl font-semibold text-sm
      text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
              >
                <FaSignOutAlt className="text-lg" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl font-semibold text-sm bg-slate-900
  text-white hover:bg-slate-800 transition-all duration-200"
              >
                <FaUser className="text-lg" />
                <span className="hidden sm:inline">Login</span>
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl font-semibold text-sm bg-emerald-600
  text-white hover:bg-emerald-700 transition-all duration-200"
              >
                <FaUserPlus className="text-lg" />
                <span className="hidden sm:inline">Register</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
