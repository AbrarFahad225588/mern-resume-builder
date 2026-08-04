import express from 'express';
import mongoose from 'mongoose';
import { authMiddleware } from '../middleware/auth.js';
import Resume from '../models/Resume.js';
const router = express.Router();

// A malformed id makes Mongoose throw a CastError, which the catch blocks below
// would report as a 500. A bad id is a client mistake, so answer 404 instead.
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Ownership and identity are decided by the auth middleware, never by the
// client. Without stripping these, `...req.body` (which is spread AFTER
// `user`) would let a caller assign a resume to somebody else's account, and
// `$set` could rewrite `_id`.
const sanitizeResumePayload = (body = {}) => {
    const { user, _id, __v, createdAt, updatedAt, ...safe } = body;
    return safe;
};
// get all resumes for the authenticated   user
router.get('/', authMiddleware, async (req, res) => {
    try {
        // The sort must be applied to the Mongoose query, not to the resolved
        // array: `[].sort({...})` throws because an object is not a comparator.
        const resumes = await Resume.find({ user: req.user?._id }).sort({ updatedAt: -1 });
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
        if (!isValidId(req.params.id)) {
            return res.status(404).json({ message: 'Resume not found' });
        }
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
            ...sanitizeResumePayload(req.body),
            user: req.user?._id
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
        if (!isValidId(req.params.id)) {
            return res.status(404).json({ message: 'Resume not found' });
        }
        const updatedResume = await Resume.findOneAndUpdate(
            { _id: req.params.id, user: req.user?._id },
            { $set: sanitizeResumePayload(req.body) },
            // `runValidators` keeps schema rules (e.g. enum/maxlength) enforced
            // on updates; by default Mongoose skips them for findOneAndUpdate.
            { new: true, runValidators: true }
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
        if (!isValidId(req.params.id)) {
            return res.status(404).json({ message: 'Resume not found' });
        }
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