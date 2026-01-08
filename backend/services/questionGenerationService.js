/**
 * Question Generation Service
 * Generates 5 technical interview questions based on candidate skills
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

class QuestionGenerationService {
    constructor(apiKey) {
        this.client = new GoogleGenerativeAI(apiKey);
        this.model = this.client.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }

    /**
     * Generate 5 technical interview questions based on skills
     * @param {Array} skills - Array of candidate skills
     * @param {string} experienceLevel - Experience level (junior, mid, senior)
     * @returns {Promise<Array>} Array of 5 questions with correct answers
     */
    async generateQuestions(skills, experienceLevel = 'mid') {
        if (!skills || skills.length === 0) {
            throw new Error('No skills provided for question generation');
        }

        const selectedSkills = skills.slice(0, 5);
        const difficultyMap = {
            junior: 'basic to intermediate',
            mid: 'intermediate to advanced',
            senior: 'advanced to expert'
        };

        const prompt = `You are an expert technical interviewer. Generate exactly 5 technical interview questions based on the following candidate skills: ${selectedSkills.join(', ')}.

Experience Level: ${experienceLevel} (${difficultyMap[experienceLevel] || 'intermediate'})

Requirements:
1. Each question should test one specific skill from the list
2. Questions must increase in difficulty (Q1 basic, Q5 expert level)
3. Questions should be practical and real-world scenario based
4. For each question, provide a comprehensive correct answer (3-5 sentences)
5. Answers should demonstrate deep understanding of the skill

Return a JSON array with exactly 5 objects in this format:
[
  {
    "id": 1,
    "skill": "skill name",
    "question": "the question text",
    "correct_answer": "comprehensive correct answer",
    "difficulty": "easy|medium|hard",
    "keywords": ["keyword1", "keyword2", "keyword3"]
  }
]

Only return the JSON array, no markdown or extra text.`;

        try {
            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();

            let questions = JSON.parse(responseText);

            // Ensure exactly 5 questions
            questions = questions.slice(0, 5);
            if (questions.length < 5) {
                console.warn(`Generated only ${questions.length} questions, expected 5`);
            }

            return questions;
        } catch (error) {
            console.error('Error generating questions:', error);
            throw new Error(`Failed to generate questions: ${error.message}`);
        }
    }

    /**
     * Validate generated questions format
     * @param {Array} questions - Questions array
     * @returns {boolean} Whether questions are valid
     */
    static validateQuestions(questions) {
        if (!Array.isArray(questions) || questions.length !== 5) {
            return false;
        }

        return questions.every(q =>
            q.id !== undefined &&
            q.skill &&
            q.question &&
            q.correct_answer &&
            q.difficulty &&
            Array.isArray(q.keywords)
        );
    }
}

module.exports = QuestionGenerationService;
