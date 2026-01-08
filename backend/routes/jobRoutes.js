/**
 * API Routes for Job Matching and Applications
 */

const express = require('express');
const RAGService = require('../services/ragService');
const EmailService = require('../services/emailService');
const ResumeService = require('../services/resumeService');
const path = require('path');

const router = express.Router();

// Initialize RAG service
const ragService = new RAGService();

/**
 * POST /api/jobs/load-data
 * Load jobs data from CSV
 */
router.post('/load-data', async (req, res) => {
    try {
        const { csvPath } = req.body;

        if (!csvPath) {
            return res.status(400).json({
                success: false,
                error: 'csvPath is required'
            });
        }

        await ragService.loadJobsData(csvPath);

        res.json({
            success: true,
            message: `Loaded ${ragService.getAllJobs().length} jobs`,
            jobs_count: ragService.getAllJobs().length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/jobs/match
 * Get matching jobs for verified candidate
 */
router.post('/match', (req, res) => {
    try {
        const { candidateSkills, evaluationResult, topK = 5 } = req.body;

        if (!candidateSkills || !Array.isArray(candidateSkills)) {
            return res.status(400).json({
                success: false,
                error: 'candidateSkills array is required'
            });
        }

        if (!evaluationResult) {
            return res.status(400).json({
                success: false,
                error: 'evaluationResult is required'
            });
        }

        const matchResult = ragService.retrieveMatchingJobs(
            candidateSkills,
            evaluationResult,
            topK
        );

        res.json({
            success: true,
            ...matchResult
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/jobs/apply
 * Send applications to matched jobs
 */
router.post('/apply', async (req, res) => {
    try {
        const { resume, matchedJobs, candidateInfo, smtpConfig } = req.body;

        if (!resume) {
            return res.status(400).json({
                success: false,
                error: 'resume object is required'
            });
        }

        if (!matchedJobs || !Array.isArray(matchedJobs) || matchedJobs.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'matchedJobs array is required and must not be empty'
            });
        }

        if (!candidateInfo) {
            return res.status(400).json({
                success: false,
                error: 'candidateInfo is required'
            });
        }

        if (!smtpConfig) {
            return res.status(400).json({
                success: false,
                error: 'smtpConfig is required'
            });
        }

        // Generate resume PDF
        const emailService = new EmailService(smtpConfig);
        const resumePDF = await emailService.generateResumePDF(resume);

        // Send batch applications
        const results = await emailService.sendBatchApplications(
            matchedJobs,
            candidateInfo,
            resumePDF
        );

        const successCount = results.filter(r => r.status === 'sent').length;
        const failureCount = results.filter(r => r.status === 'failed').length;

        res.json({
            success: true,
            message: `Applications sent: ${successCount}, Failed: ${failureCount}`,
            applications: results,
            summary: {
                total_sent: successCount,
                total_failed: failureCount,
                companies_applied: results.map(r => r.company)
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
 * GET /api/jobs/all
 * Get all available jobs
 */
router.get('/all', (req, res) => {
    try {
        const jobs = ragService.getAllJobs();

        res.json({
            success: true,
            jobs: jobs,
            total_jobs: jobs.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
