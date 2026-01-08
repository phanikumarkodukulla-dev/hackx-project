/**
 * Answer Evaluation Service
 * Evaluates user answers using Gemini API with semantic comparison
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

class AnswerEvaluationService {
    constructor(apiKey) {
        this.client = new GoogleGenerativeAI(apiKey);
        this.model = this.client.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }

    /**
     * Evaluate a single answer against the correct answer
     * @param {string} question - The interview question
     * @param {string} userAnswer - User's answer to evaluate
     * @param {string} correctAnswer - The correct answer from generation
     * @param {Array} keywords - Keywords that should be present
     * @returns {Promise<Object>} Evaluation result with score and feedback
     */
    async evaluateAnswer(question, userAnswer, correctAnswer, keywords = []) {
        const prompt = `You are an expert technical interviewer evaluating a candidate's answer to a technical question.

Question: "${question}"

Correct Answer (reference): "${correctAnswer}"

Candidate's Answer: "${userAnswer}"

Expected Keywords: ${keywords.join(', ')}

Evaluate the candidate's answer based on:
1. Technical Accuracy (0-40 points): Does the answer correctly address the question?
2. Completeness (0-30 points): Does it cover the main concepts?
3. Clarity (0-20 points): Is the answer clear and well-structured?
4. Keyword Coverage (0-10 points): Are key concepts mentioned?

Return a JSON object with:
{
  "score": number (0-100),
  "accuracy": number (0-40),
  "completeness": number (0-30),
  "clarity": number (0-20),
  "keyword_score": number (0-10),
  "verdict": "pass|fail",
  "feedback": "specific feedback about the answer",
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"]
}

Only return the JSON object, no markdown or extra text.`;

        try {
            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();

            const evaluation = JSON.parse(responseText);

            // Ensure score is within bounds
            evaluation.score = Math.max(0, Math.min(100, evaluation.score));

            return {
                ...evaluation,
                passed: evaluation.score >= 70
            };
        } catch (error) {
            console.error('Error evaluating answer:', error);
            throw new Error(`Failed to evaluate answer: ${error.message}`);
        }
    }

    /**
     * Evaluate all 5 answers and determine if candidate is VERIFIED
     * @param {Array} questions - Array of interview questions
     * @param {Array} userAnswers - Array of user answers
     * @returns {Promise<Object>} Overall evaluation result
     */
    async evaluateAllAnswers(questions, userAnswers) {
        if (!Array.isArray(questions) || !Array.isArray(userAnswers)) {
            throw new Error('Questions and userAnswers must be arrays');
        }

        if (questions.length !== userAnswers.length) {
            throw new Error('Number of questions must match number of answers');
        }

        const evaluations = [];
        let totalScore = 0;

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const answer = userAnswers[i];

            const evaluation = await this.evaluateAnswer(
                q.question,
                answer,
                q.correct_answer,
                q.keywords
            );

            evaluations.push({
                question_id: q.id,
                skill: q.skill,
                question: q.question,
                user_answer: answer,
                evaluation: evaluation
            });

            totalScore += evaluation.score;
        }

        const averageScore = totalScore / questions.length;
        const passingThreshold = 70;

        return {
            is_verified: averageScore >= passingThreshold,
            average_score: Math.round(averageScore),
            total_score: Math.round(totalScore),
            passing_threshold: passingThreshold,
            individual_evaluations: evaluations,
            summary: {
                passed_questions: evaluations.filter(e => e.evaluation.passed).length,
                total_questions: evaluations.length,
                status: averageScore >= passingThreshold ? 'VERIFIED' : 'NOT_VERIFIED'
            }
        };
    }

    /**
     * Generate feedback for failed evaluation
     * @param {Object} evaluationResult - Result from evaluateAllAnswers
     * @returns {string} Formatted feedback message
     */
    static generateFeedbackMessage(evaluationResult) {
        const { average_score, summary, individual_evaluations } = evaluationResult;

        let message = `\n=== INTERVIEW EVALUATION RESULTS ===\n`;
        message += `Average Score: ${average_score}/100\n`;
        message += `Questions Passed: ${summary.passed_questions}/${summary.total_questions}\n\n`;

        individual_evaluations.forEach(evalResult => {
            message += `Question ${evalResult.question_id} (${evalResult.skill}):\n`;
            message += `Score: ${evalResult.evaluation.score}/100\n`;
            message += `Verdict: ${evalResult.evaluation.verdict}\n`;
            message += `Feedback: ${evalResult.evaluation.feedback}\n`;
            message += `---\n`;
        });

        message += `\nOverall Status: ${summary.status}\n`;

        return message;
    }
}

module.exports = AnswerEvaluationService;
