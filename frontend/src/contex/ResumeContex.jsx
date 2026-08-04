import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { authApi, resumeApi, templateApi } from "../services/api";
import { toast } from "react-hot-toast";
import { ResumeContext } from "./resumeContext";

// Turns an axios failure into something a user can act on. Without this every
// problem collapses into the same vague "Failed to ..." text, which hides the
// most common cause during development: the API server simply is not running.
const describeApiError = (error, fallback) => {
  if (error?.response) {
    return error.response.data?.message || fallback;
  }
  if (error?.request) {
    return "Cannot reach the server. Make sure the backend is running.";
  }
  return error?.message || fallback;
};

export const ResumeProvider = ({ children }) => {
  const [templates, setTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [currentResume, setCurrentResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const [authchecked, setAuthChecked] = useState(false);

  // Mirrors `isAuthenticated` so `fetchResumes` can read the latest value
  // without listing it as a dependency. Depending on the state directly would
  // give the callback a new identity on every sign-in/sign-out and re-run the
  // bootstrap effect below that consumes it.
  const isAuthenticatedRef = useRef(isAuthenticated);
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  // Same trick for the open resume, so `saveCurrentResume` and `deleteResume`
  // can read it without taking a dependency on it.
  const currentResumeRef = useRef(currentResume);
  useEffect(() => {
    currentResumeRef.current = currentResume;
  }, [currentResume]);

  // The three callbacks the bootstrap effect depends on are memoised with
  // useCallback so the effect runs once instead of on every render. They are
  // declared before the handlers that call them because the React Compiler
  // cannot preserve memoization for a value that is referenced above its own
  // declaration.
  const getCurrentUser = useCallback(async () => {
    try {
      const response = await authApi.getMe();
      const userData = response.data.user;
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      // A 401 simply means nobody is logged in yet. That is the normal
      // state on a first visit, so it must not be reported as an error.
      if (error.response?.status !== 401) {
        setError(error);
        toast.error(describeApiError(error, "Failed to get current user"));
      }
      setUser(null);
      setIsAuthenticated(false);
      return null;
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await templateApi.getTemplates();
      setTemplates(response.data.templates || []);
      return response.data.templates || [];
    } catch (error) {
      setError(error);
      toast.error(describeApiError(error, "Failed to fetch templates"));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Callers that have just signed in can pass `authed` explicitly to bypass the
  // `isAuthenticated` state, which is still stale inside this closure until the
  // next render. Everyone else gets the latest value from the ref.
  const fetchResumes = useCallback(async (authed) => {
    if (!(authed ?? isAuthenticatedRef.current)) {
      setResumes([]);
      return [];
    }
    setLoading(true);
    try {
      const response = await resumeApi.getResumes();
      setResumes(response.data.resumes || []);
      return response.data.resumes || [];
    } catch (error) {
      setError(error);
      toast.error(describeApiError(error, "Failed to fetch resumes"));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(
    async (email, password) => {
      setLoading(true);
      try {
        const response = await authApi.login({ email, password });
        const { user: userData, token } = response.data;
        // Mirrors register(): the request interceptor reads this token from
        // localStorage. Without it a logged-in user relied solely on the
        // cookie, so the Authorization header was missing after any reload.
        if (token) {
          localStorage.setItem("token", token);
        }
        setIsAuthenticated(true);
        setUser(userData);
        await fetchResumes(true);
        await fetchTemplates();
        toast.success(response.data?.message || "Login successful");
        return userData;
      } catch (error) {
        setError(error);
        toast.error(describeApiError(error, "Failed to login"));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchResumes, fetchTemplates],
  );

  const register = useCallback(
    async (name, email, password) => {
      setLoading(true);
      try {
        const response = await authApi.register({ name, email, password });

        // Extract data from response
        const { user, token, message } = response.data;

        // If token exists, store it. The api request interceptor reads it from
        // localStorage and sets the Authorization header on every request.
        if (token) {
          localStorage.setItem("token", token);
        }

        // Update auth state
        setIsAuthenticated(true);
        setUser(user);
        await fetchResumes(true);
        await fetchTemplates();

        toast.success(message || "Registration successful");

        // Return consistent response object
        return {
          success: true,
          message: message || "Registration successful",
          user: user,
          token: token,
        };
      } catch (error) {
        console.error("Registration error:", error);

        // Handle different error scenarios
        let errorMessage = "Failed to register. Please try again.";
        let fieldErrors = [];

        if (error.response) {
          // Server responded with error
          const data = error.response.data;

          if (data.errors && Array.isArray(data.errors)) {
            errorMessage = data.errors[0]?.msg || errorMessage;
            fieldErrors = data.errors;
          } else if (data.message) {
            errorMessage = data.message;
          }

          // Handle specific status codes
          if (error.response.status === 400) {
            errorMessage = data.message || "Invalid registration data";
          } else if (error.response.status === 409) {
            errorMessage = "User already exists. Please login instead.";
          }
        } else if (error.request) {
          // Request made but no response
          errorMessage = "No response from server. Please check your connection.";
        } else {
          // Something else happened
          errorMessage = error.message || "An error occurred during registration";
        }

        toast.error(errorMessage);
        setError(error);

        // Return consistent error response
        return {
          success: false,
          message: errorMessage,
          errors: fieldErrors,
          error: error,
        };
      } finally {
        setLoading(false);
      }
    },
    [fetchResumes, fetchTemplates],
  );
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
      localStorage.removeItem("token");
      setIsAuthenticated(false);
      setUser(null);
      setResumes([]);
      setCurrentResume(null);
      toast.success("Logout successful");
    } catch (error) {
      setError(error);
      toast.error("Failed to logout");
    }
  }, []);

  const fetchTemplate = useCallback(async (templateId) => {
    setLoading(true);
    try {
      const response = await templateApi.getTemplateById(templateId);
      setCurrentTemplate(response.data.template || null);
      return response.data.template || [];
    } catch (error) {
      setError(error);
      toast.error("Failed to fetch template");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Must stay memoised: the editor loads a resume from an effect that lists
  // this function as a dependency. An unstable identity there re-triggers the
  // effect on every render and the editor never leaves its loading state.
  const fetchResume = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await resumeApi.getResumeById(id);
      setCurrentResume(response.data.resume || null);
      return response.data.resume || [];
    } catch (error) {
      setError(error);
      toast.error(describeApiError(error, "Failed to fetch resume"));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createResume = useCallback(async (resumeData) => {
    setLoading(true);
    try {
      const response = await resumeApi.createResume(resumeData);
      const newResume = response.data.resume;
      setResumes((prevResumes) => [...prevResumes, newResume]);
      setCurrentResume(response.data.resume || null);
      toast.success("Resume created successfully");
      return response.data.resume || [];
    } catch (error) {
      setError(error);
      toast.error(describeApiError(error, "Failed to create resume"));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const updateResume = useCallback(async (id, resumeData) => {
    setLoading(true);
    try {
      const response = await resumeApi.updateResume(id, resumeData);
      setResumes((prevResumes) =>
        prevResumes.map((resume) =>
          resume._id === id ? response.data.resume : resume,
        ),
      );
      setCurrentResume(response.data.resume || null);
      toast.success("Resume updated successfully");
      return response.data.resume || [];
    } catch (error) {
      setError(error);
      toast.error(describeApiError(error, "Failed to update resume"));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteResume = useCallback(async (id) => {
    if (!window.confirm("Are you sure you want to delete this resume?")) {
      return;
    }
    setLoading(true);
    try {
      await resumeApi.deleteResume(id);
      setResumes((prevResumes) =>
        prevResumes.filter((resume) => resume._id !== id),
      );
      // Functional form keeps this callback free of a `currentResume` dep.
      setCurrentResume((cur) => (cur && cur._id === id ? null : cur));
      toast.success("Resume deleted successfully");
    } catch (error) {
      setError(error);
      toast.error(describeApiError(error, "Failed to delete resume"));
    } finally {
      setLoading(false);
    }
  }, []);

  const saveCurrentResume = useCallback(async () => {
    const draft = currentResumeRef.current;
    if (!draft) {
      return null;
    }
    if (draft._id) {
      return await updateResume(draft._id, draft);
    }
    return await createResume(draft);
  }, [createResume, updateResume]);
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getCurrentUser();
        if (userData) {
          setIsAuthenticated(true);
          setUser(userData);
          await fetchResumes(true);
          await fetchTemplates();
        } else {
          setIsAuthenticated(false);
          setUser(null);
          // Templates are public, so they can load for signed-out visitors too.
          await fetchTemplates();
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        // Always flag the check as finished so guarded routes stop waiting.
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, [getCurrentUser, fetchResumes, fetchTemplates]);

  // Memoised so the value only changes when actual state does. A fresh object
  // literal here would re-render every consumer on each provider render, and
  // any consumer effect depending on one of these functions would re-run.
  const value = useMemo(
    () => ({
      isAuthenticated,
      user,
      resumes,
      currentResume,
      templates,
      currentTemplate,
      loading,
      error,
      authchecked,
      setCurrentResume,
      setCurrentTemplate,
      setTemplates,
      setResumes,
      setUser,
      setIsAuthenticated,
      setLoading,
      setError,
      setAuthChecked,
      register,
      login,
      logout,
      getCurrentUser,
      fetchTemplates,
      fetchTemplate,
      fetchResumes,
      fetchResume,
      createResume,
      updateResume,
      deleteResume,
      saveCurrentResume,
    }),
    [
      isAuthenticated,
      user,
      resumes,
      currentResume,
      templates,
      currentTemplate,
      loading,
      error,
      authchecked,
      register,
      login,
      logout,
      getCurrentUser,
      fetchTemplates,
      fetchTemplate,
      fetchResumes,
      fetchResume,
      createResume,
      updateResume,
      deleteResume,
      saveCurrentResume,
    ],
  );

  return (
    <ResumeContext.Provider value={value}>
      {children}
    </ResumeContext.Provider>
  );
};
