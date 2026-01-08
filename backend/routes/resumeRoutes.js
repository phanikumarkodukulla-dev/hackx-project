/**
 * API Routes for Interview System
 */

const express = require('express');
const ResumeService = require('../services/resumeService');

const router = express.Router();

/**
 * POST /api/resume/load
 * Load and parse resume from JSON file
 */
router.post('/load', (req, res) => {
    try {
        const { resumePath } = req.body;

        if (!resumePath) {
            return res.status(400).json({
                success: false,
                error: 'resumePath is required'
            });
        }

        const resume = ResumeService.loadResume(resumePath);

        if (!ResumeService.validateResume(resume)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid resume structure'
            });
        }

        const skills = ResumeService.extractSkills(resume);
        const experienceLevel = ResumeService.extractExperienceLevel(resume);
        const jobRoles = ResumeService.extractJobRoles(resume);
        const candidateInfo = ResumeService.extractCandidateInfo(resume);

        res.json({
            success: true,
            resume: resume,
            analysis: {
                candidate_info: candidateInfo,
                skills: skills,
                experience_level: experienceLevel,
                job_roles: jobRoles
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/resume/analyze
 * Analyze provided resume data
 */
router.post('/analyze', (req, res) => {
    try {
        const { resume } = req.body;

        if (!resume) {
            return res.status(400).json({
                success: false,
                error: 'resume object is required'
            });
        }

        if (!ResumeService.validateResume(resume)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid resume structure'
            });
        }

        const skills = ResumeService.extractSkills(resume);
        const experienceLevel = ResumeService.extractExperienceLevel(resume);
        const jobRoles = ResumeService.extractJobRoles(resume);
        const candidateInfo = ResumeService.extractCandidateInfo(resume);

        res.json({
            success: true,
            analysis: {
                candidate_info: candidateInfo,
                skills: skills,
                experience_level: experienceLevel,
                job_roles: jobRoles
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
