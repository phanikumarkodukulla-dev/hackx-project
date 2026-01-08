/**
 * RAG Service - Job Matching using Vector Database
 * Implements Retrieval-Augmented Generation for job matching
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

class RAGService {
    constructor() {
        this.jobs = [];
        this.jobIndex = {};
    }

    /**
     * Load jobs data from CSV file
     * @param {string} csvPath - Path to jobsdata.csv
     */
    async loadJobsData(csvPath) {
        return new Promise((resolve, reject) => {
            this.jobs = [];
            this.jobIndex = {};

            if (!fs.existsSync(csvPath)) {
                reject(new Error(`Jobs CSV file not found: ${csvPath}`));
                return;
            }

            fs.createReadStream(csvPath)
                .pipe(csv())
                .on('data', (row) => {
                    const job = {
                        id: this.jobs.length + 1,
                        company_name: row.company_name || '',
                        job_role: row.job_role || '',
                        required_skills: this._parseSkills(row.required_skills),
                        company_email: row.company_email || '',
                        job_description: row.job_description || '',
                        location: row.location || '',
                        salary_range: row.salary_range || ''
                    };

                    this.jobs.push(job);
                    this.jobIndex[job.id] = job;
                })
                .on('end', () => {
                    console.log(`Loaded ${this.jobs.length} jobs from CSV`);
                    resolve(this.jobs);
                })
                .on('error', (error) => {
                    reject(new Error(`Failed to load jobs CSV: ${error.message}`));
                });
        });
    }

    /**
     * Retrieve matching jobs for a candidate
     * @param {Array} candidateSkills - Candidate's technical skills
     * @param {Object} evaluationResult - Interview evaluation results
     * @param {number} topK - Number of top matches to return
     * @returns {Array} Sorted list of matching jobs
     */
    retrieveMatchingJobs(candidateSkills, evaluationResult, topK = 5) {
        if (this.jobs.length === 0) {
            throw new Error('No jobs loaded. Call loadJobsData first.');
        }

        if (!evaluationResult.is_verified) {
            return {
                matched_jobs: [],
                message: 'Candidate not verified. No job applications sent.',
                reason: 'verification_failed'
            };
        }

        const matches = this.jobs.map(job => ({
            job,
            match_score: this._calculateMatchScore(candidateSkills, job),
            matched_skills: this._findMatchedSkills(candidateSkills, job)
        }));

        // Sort by match score descending
        matches.sort((a, b) => b.match_score - a.match_score);

        // Filter jobs with at least 40% skill match
        const filteredMatches = matches.filter(m => m.match_score >= 40);

        return {
            matched_jobs: filteredMatches.slice(0, topK).map(m => ({
                id: m.job.id,
                company_name: m.job.company_name,
                job_role: m.job.job_role,
                company_email: m.job.company_email,
                location: m.job.location,
                salary_range: m.job.salary_range,
                required_skills: m.job.required_skills,
                match_score: Math.round(m.match_score),
                matched_skills: m.matched_skills,
                application_status: 'pending'
            })),
            total_matches: filteredMatches.length,
            candidate_score: evaluationResult.average_score,
            verification_status: 'VERIFIED'
        };
    }

    /**
     * Calculate match score between candidate skills and job requirements
     * @private
     */
    _calculateMatchScore(candidateSkills, job) {
        if (!job.required_skills || job.required_skills.length === 0) {
            return 0;
        }

        const skillsLower = candidateSkills.map(s => s.toLowerCase());
        const requiredLower = job.required_skills.map(s => s.toLowerCase());

        let matches = 0;
        requiredLower.forEach(reqSkill => {
            if (skillsLower.some(cSkill =>
                cSkill.includes(reqSkill) || reqSkill.includes(cSkill)
            )) {
                matches++;
            }
        });

        return (matches / requiredLower.length) * 100;
    }

    /**
     * Find specific skills that match between candidate and job
     * @private
     */
    _findMatchedSkills(candidateSkills, job) {
        const skillsLower = candidateSkills.map(s => s.toLowerCase());
        const matched = [];

        job.required_skills.forEach(reqSkill => {
            if (skillsLower.some(cSkill =>
                cSkill.includes(reqSkill.toLowerCase()) ||
                reqSkill.toLowerCase().includes(cSkill)
            )) {
                matched.push(reqSkill);
            }
        });

        return matched;
    }

    /**
     * Parse comma-separated skills from CSV field
     * @private
     */
    _parseSkills(skillsString) {
        if (!skillsString) return [];
        return skillsString
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0);
    }

    /**
     * Get all jobs
     */
    getAllJobs() {
        return this.jobs;
    }

    /**
     * Get job by ID
     */
    getJobById(jobId) {
        return this.jobIndex[jobId] || null;
    }
}

module.exports = RAGService;
