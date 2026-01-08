/**
 * API Routes for Answer Evaluation
 */

const express = require('express');
const AnswerEvaluationService = require('../services/answerEvaluationService');

const router = express.Router();

// Store evaluation results temporarily (in production, use database)
const evaluationCache = new Map();

/**
 * POST /api/answers/evaluate
 * Evaluate all 5 answers and determine verification status
 */
router.post('/evaluate', async (req, res) => {
    try {
        const { questions, answers, sessionId } = req.body;

        if (!questions || !Array.isArray(questions)) {
            return res.status(400).json({
                success: false,
                error: 'questions array is required'
            });
        }

        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({
                success: false,
                error: 'answers array is required'
            });
        }

        if (questions.length !== answers.length) {
            return res.status(400).json({
                success: false,
                error: 'Number of questions must match number of answers'
            });
        }

        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            return res.status(500).json({
                success: false,
                error: 'GEMINI_API_KEY not configured'
            });
        }

        const evaluationService = new AnswerEvaluationService(geminiApiKey);
        const evaluationResult = await evaluationService.evaluateAllAnswers(questions, answers);

        // Cache evaluation result
        if (sessionId) {
            evaluationCache.set(sessionId, evaluationResult);
        }

        // Prepare response (don't expose full answer details to security)
        const response = {
            success: true,
            verification_status: evaluationResult.summary.status,
            is_verified: evaluationResult.is_verified,
            average_score: evaluationResult.average_score,
            passing_threshold: evaluationResult.passing_threshold,
            summary: evaluationResult.summary,
            detailed_results: evaluationResult.individual_evaluations.map(eval => ({
                question_id: eval.question_id,
                skill: eval.skill,
                score: eval.evaluation.score,
                verdict: eval.evaluation.verdict,
                feedback: eval.evaluation.feedback,
                strengths: eval.evaluation.strengths,
                improvements: eval.evaluation.improvements
            }))
        };

        res.json(response);
    } catch (error) {
        console.error('Error evaluating answers:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/answers/evaluation/:sessionId
 * Retrieve cached evaluation result
 */
router.get('/evaluation/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        const evaluation = evaluationCache.get(sessionId);

        if (!evaluation) {
            return res.status(404).json({
                success: false,
                error: 'Evaluation result not found'
            });
        }

        res.json({
            success: true,
            evaluation: evaluation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
