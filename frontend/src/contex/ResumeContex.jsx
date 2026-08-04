import { createContext, useContext, useEffect, useState } from "react";
import { authApi, resumeApi, templateApi } from "../services/api";
import { toast } from "react-hot-toast";


const ResumeContext = createContext();

export const useResume = () => useContext(ResumeContext);
   
export const ResumeProvider = ({ children }) => {
    const [templates, setTemplates] = useState([]);
    const [currentTemplate, setCurrentTemplate] = useState(null);
    const [resumes, setResumes] = useState([]);
    const [currentResume, setCurrentResume] = useState(null);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const userData = await getCurrentUser();
                if (userData) {
                setIsAuthenticated(true);
                setUser(userData);
                await fetchResumes();
                await fetchTemplates();
                }else {
                setIsAuthenticated(false);
                setUser(null);
                }
                setIsAuthenticated(true);
            } catch (error) {
                setUser(null);
                setIsAuthenticated(false);
            }
        };

        checkAuth();
    }, []);
    const getCurrentUser = async () => {};
    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const response = await templateApi.getTemplates();
            setTemplates(response.data || []);
            return response.data || [];
        }catch (error) {
            setError(error);
            toast.error('Failed to fetch templates');
            return [];
        }finally {
            setLoading(false);
        }
    };
    const fetchTemplate = async (templateId) => {
        setLoading(true);
        try {
            const response = await templateApi.getTemplateById(templateId);
            setCurrentTemplate(response.data || null);
            return response.data || [];
        }catch (error) {
            setError(error);
            toast.error('Failed to fetch template');
            return [];
        }finally {
            setLoading(false);
        }
    };
    const fetchResumes = async () => {
        if (!isAuthenticated) {
            setResumes([]);
            return [];
        }
          setLoading(true);
        try {
            const response = await resumeApi.getResumes();
            setResumes(response.data || []);
            return response.data || [];
        }catch (error) {
            setError(error);
            toast.error('Failed to fetch resumes');
            return [];
        }finally {
            setLoading(false);
        }
    };
    
    const fetchResume = async () => {};
    
};