/**
 * API Routes for Interview Questions
 */

const express = require('express');
const QuestionGenerationService = require('../services/questionGenerationService');

const router = express.Router();

/**
 * POST /api/questions/generate
 * Generate 5 interview questions based on skills
 */
router.post('/generate', async (req, res) => {
    try {
        const { skills, experienceLevel = 'mid' } = req.body;

        if (!skills || !Array.isArray(skills) || skills.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'skills array is required and must not be empty'
            });
        }

        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            return res.status(500).json({
                success: false,
                error: 'GEMINI_API_KEY not configured'
            });
        }

        const questionService = new QuestionGenerationService(geminiApiKey);
        const questions = await questionService.generateQuestions(skills, experienceLevel);

        if (!QuestionGenerationService.validateQuestions(questions)) {
            return res.status(500).json({
                success: false,
                error: 'Generated questions do not meet validation criteria'
            });
        }

        // Store questions in session (in production, use database or session storage)
        // For now, we return questions with answers and let frontend store them
        const questionsForUI = questions.map(q => ({
            id: q.id,
            skill: q.skill,
            question: q.question,
            difficulty: q.difficulty
            // NEVER send correct_answer to frontend
        }));

        // Keep full questions with answers server-side
        req.session = req.session || {};
        req.session.fullQuestions = questions;

        res.json({
            success: true,
            questions: questionsForUI,
            metadata: {
                total_questions: questions.length,
                skills_assessed: [...new Set(questions.map(q => q.skill))],
                experience_level: experienceLevel
            }
        });
    } catch (error) {
        console.error('Error generating questions:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
