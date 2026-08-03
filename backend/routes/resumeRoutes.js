import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import Resume from '../models/Resume.js';
const router = express.Router();
// get all resumes for the authenticated   user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const resumes = (await Resume.find({ user: req.user?._id })).sort({ updatedAt: -1 });
        res.json({ success: true, resumes,message: "Resumes fetched successfully" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// get single resume by id for the authenticated user
router.get('/:id', authMiddleware, async (req, res) => {
    try {   
        const resume = await Resume.findOne({ _id: req.params.id, user: req.user?._id });
        if (!resume) {
            return res.status(404).json({ message: 'Resume not found' });
        }
        res.json({ success: true, resume, message: 'Resume fetched successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// create a new resume for the authenticated user
router.post('/', authMiddleware, async (req, res) => {
    try {
        const newResume = new Resume({
            user: req.user?._id,
            ...req.body
        });
        const savedResume = await newResume.save();
        res.status(201).json({ success: true, resume: savedResume, message: 'Resume created successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// update a resume by id for the authenticated user
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const updatedResume = await Resume.findOneAndUpdate(
            { _id: req.params.id, user: req.user?._id },
            { $set: req.body },
            { new: true }
        );
        if (!updatedResume) {
            return res.status(404).json({ message: 'Resume not found' });
        }
        res.json({ success: true, resume: updatedResume, message: 'Resume updated successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// delete a resume by id for the authenticated user
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const deletedResume = await Resume.findOneAndDelete({ _id: req.params.id, user: req.user?._id });
        if (!deletedResume) {
            return res.status(404).json({ message: 'Resume not found' });
        }
        res.json({ success: true, message: 'Resume deleted successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;