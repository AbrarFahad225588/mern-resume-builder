import { Link } from "react-router-dom";
import { FaHome, FaPalette } from "react-icons/fa";

const NotFound = () => (
  <div className="flex min-h-[70vh] items-center justify-center px-4">
    <div className="text-center">
      <p className="text-8xl font-black tracking-tight text-blue-600">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="mx-auto mt-2 max-w-md text-slate-500">
        The page you are looking for does not exist or may have been moved.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700"
        >
          <FaHome />
          Go Home
        </Link>
        <Link
          to="/templates"
          className="flex items-center gap-2 rounded-full bg-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
        >
          <FaPalette />
          Browse Templates
        </Link>
      </div>
    </div>
  </div>
);

export default NotFound;
