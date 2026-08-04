import { useNavigate, Link } from "react-router-dom";
import { useResume } from "../contex/ResumeContex";
import {
  FaCheckCircle,
  FaDownload,
  FaEdit,
  FaFileAlt,
  FaPalette,
  FaRocket,
  FaStar,
} from "react-icons/fa";

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useResume();

  const handleCreateNew = async () => {
    if (isAuthenticated) {
      navigate("/editor/new");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center px-4 py-8 md:py-12 max-w-7xl mx-auto">
      <div className="flex flex-col items-center text-center max-w-5xl mx-auto w-full space-y-6 md:space-y-8">
        {/* Hero Section */}
        <h1 className="text-4xl md:text-6xl font-black text-slate-800 tracking-tight">
          Build Your <span className="text-blue-600">Professional</span> Resume
        </h1>

        <p className="text-lg md:text-xl text-slate-600 max-w-2xl">
          Create a stunning resume in minutes with our easy-to-use builder.
          Choose from professional templates and land your dream job.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-6 md:px-8 py-3 rounded-xl font-bold text-sm md:text-base
            bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 
            transition-all duration-200"
          >
            <FaEdit className="text-lg" />
            Create New Resume
          </button>

          <Link
            to="/templates"
            className="flex items-center gap-2 px-6 md:px-8 py-3 rounded-xl font-bold text-sm md:text-base
            bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all duration-200"
          >
            <FaPalette className="text-lg" />
            View Templates
          </Link>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 pt-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <FaCheckCircle className="text-green-500" />
            <span>10+ Templates</span>
          </div>
          <div className="flex items-center gap-2">
            <FaCheckCircle className="text-green-500" />
            <span>Real-time Editing</span>
          </div>
          <div className="flex items-center gap-2">
            <FaCheckCircle className="text-green-500" />
            <span>PDF Export</span>
          </div>
          <div className="flex items-center gap-2">
            <FaCheckCircle className="text-green-500" />
            <span>Free to Use</span>
          </div>
        </div>

          {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
              <FaFileAlt className="text-2xl text-blue-600" />
            </div>
            <h3 className="font-bold text-slate-800">Professional Templates</h3>
            <p className="text-sm text-slate-600 mt-1">
              Choose from dozens of professionally designed templates
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
              <FaEdit className="text-2xl text-emerald-600" />
            </div>
            <h3 className="font-bold text-slate-800">Easy Editing</h3>
            <p className="text-sm text-slate-600 mt-1">
              Edit your resume in real-time with our intuitive editor
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
              <FaDownload className="text-2xl text-purple-600" />
            </div>
            <h3 className="font-bold text-slate-800">Export PDF</h3>
            <p className="text-sm text-slate-600 mt-1">
              Download your resume as a professional PDF file
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full max-w-4xl mt-12 md:mt-16">
          <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm text-center">
            <div className="text-2xl md:text-3xl font-black text-blue-600">
              10+
            </div>
            <div className="text-xs md:text-xs text-slate-500 mt-1">
              Templates
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm text-center">
            <div className="text-2xl md:text-3xl font-black text-indigo-600">
              100%
            </div>
            <div className="text-xs md:text-xs text-slate-500 mt-1">
              Free to Use
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm text-center">
            <div className="text-2xl md:text-3xl font-black text-purple-600">
              Instant
            </div>
            <div className="text-xs md:text-xs text-slate-500 mt-1">
              Download
            </div>
          </div>

          <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm text-center">
            <div className="text-2xl md:text-3xl font-black text-emerald-600">
              24/7
            </div>
            <div className="text-xs md:text-xs text-slate-500 mt-1">Access</div>
          </div>
        </div>

      

        {/* Bottom Card Section - Added mt-12 for spacing above */}
        <div className="bg-gradient-to-r from-blue-50/50 via-indigo-50/50 to-purple-50/50 rounded-2xl md:rounded-3xl p-6 md:p-8 text-center border border-blue-100/50 hover:shadow-xl transition-all duration-300 mt-12 md:mt-16">
          <div className="flex items-center justify-center gap-1 md:gap-2 mb-3">
            {[...Array(5)].map((_, i) => (
              <FaStar key={i} className="text-yellow-400 text-xl md:text-2xl" />
            ))}
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">
            Ready to build your professional resume?
          </h2>
          <p className="text-slate-500 text-sm md:text-base mb-5 md:mb-6 max-w-md mx-auto">
            Join thousands of professionals who have created stunning resumes with
            ResumeForge.
          </p>

          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-6 md:px-8 py-3 rounded-xl shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all duration-300 text-sm md:text-base"
          >
            <FaRocket className="text-base md:text-lg" />
            Get Started Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;