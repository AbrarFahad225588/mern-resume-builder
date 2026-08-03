import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import Template from '../models/Template.js';
const router = express.Router();
// get all templates for the All user
router.get('/', async (req, res) => {
    try {
        const templates = await Template.find({ isActive: true }).sort({ name: -1 });
        res.json({ success: true, templates,message: "Templates fetched successfully" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// single template by id for the all user
router.get('/:id', async (req, res) => {
    try {
        const template = await Template.findOne({ _id: req.params.id, isActive: true });
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }
        res.json({ success: true, template, message: 'Template fetched successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// seed templates
router.post('/seed',authMiddleware, async (req, res) => {
    try {
        const templates = req.body.templates;
        if (!Array.isArray(templates) || templates.length === 0) {
            return res.status(400).json({ message: 'Templates array is required' });
        }
        await Template.deleteMany({}); // Clear existing templates before seeding
        await Template.insertMany(templates);
        res.json({ success: true, message: 'Templates seeded successfully' });
    }
     catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});   

export default router;