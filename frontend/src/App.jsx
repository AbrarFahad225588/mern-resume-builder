import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import HotToast from "./components/common/HotToast";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Login from "./components/Login";
import Register from "./components/Register";
import Templates from "./components/Templates";
import Editor from "./components/Editor";
import MyResumes from "./components/MyResumes";
import NotFound from "./components/common/NotFound";
import { ResumeProvider } from "./contex/ResumeContex";
import Footer from "./components/Footer";

function App() {
  return (
    <Router>
      <ResumeProvider>
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50">
          <Navbar />
          <HotToast />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/templates" element={<Templates />} />
            {/* /editor/new?template=<id> starts a fresh resume, /editor/:id
                reopens a saved one. Both render the same component. */}
            <Route path="/editor" element={<Navigate to="/editor/new" replace />} />
            <Route path="/editor/:id" element={<Editor />} />
            <Route path="/my-resumes" element={<MyResumes />} />
            <Route path="/not-found" element={<NotFound />} />
            {/* Must stay last: a leading "/*" would shadow every route above
                it and send all navigation to the not-found page. */}
            <Route path="/*" element={<Navigate to="/not-found" replace />} />
          </Routes>
        </div>
        <Footer />
      </ResumeProvider>
    </Router>
  );
}

export default App;
