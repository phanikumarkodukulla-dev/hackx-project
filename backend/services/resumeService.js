/**
 * Resume Service
 * Reads and parses resume JSON, extracts candidate information and skills
 */

const fs = require('fs');
const path = require('path');

class ResumeService {
    /**
     * Load resume from JSON file
     * @param {string} filePath - Path to resume JSON file
     * @returns {Object} Parsed resume data
     */
    static loadResume(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`Resume file not found: ${filePath}`);
            }
            const resumeData = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(resumeData);
        } catch (error) {
            throw new Error(`Failed to load resume: ${error.message}`);
        }
    }

    /**
     * Extract candidate skills from resume
     * @param {Object} resume - Resume object
     * @returns {Object} Extracted skills with categorization
     */
    static extractSkills(resume) {
        const skills = {
            technical: [],
            soft: [],
            languages: [],
            all: []
        };

        if (!resume) {
            return skills;
        }

        // Extract from skills section
        if (resume.skills) {
            if (resume.skills.technical) {
                skills.technical = Array.isArray(resume.skills.technical)
                    ? resume.skills.technical
                    : [];
            }
            if (resume.skills.soft) {
                skills.soft = Array.isArray(resume.skills.soft)
                    ? resume.skills.soft
                    : [];
            }
            if (resume.skills.languages) {
                skills.languages = Array.isArray(resume.skills.languages)
                    ? resume.skills.languages
                    : [];
            }
        }

        // Extract from experience
        if (resume.experience && Array.isArray(resume.experience)) {
            resume.experience.forEach(exp => {
                if (exp.description && Array.isArray(exp.description)) {
                    const expSkills = this._extractSkillsFromText(exp.description.join(' '));
                    skills.technical.push(...expSkills);
                }
            });
        }

        // Extract from projects
        if (resume.projects && Array.isArray(resume.projects)) {
            resume.projects.forEach(project => {
                if (project.technologies && Array.isArray(project.technologies)) {
                    skills.technical.push(...project.technologies);
                }
            });
        }

        // Remove duplicates and compile all skills
        skills.technical = [...new Set(skills.technical)].filter(s => s && s.trim());
        skills.soft = [...new Set(skills.soft)].filter(s => s && s.trim());
        skills.languages = [...new Set(skills.languages)].filter(s => s && s.trim());
        skills.all = [
            ...skills.technical,
            ...skills.soft,
            ...skills.languages
        ];

        return skills;
    }

    /**
     * Extract experience level from resume
     * @param {Object} resume - Resume object
     * @returns {string} Experience level (junior, mid, senior)
     */
    static extractExperienceLevel(resume) {
        if (!resume || !resume.experience) {
            return 'junior';
        }

        const experienceYears = resume.experience.length * 1.5; // Rough estimation

        if (experienceYears >= 7) {
            return 'senior';
        } else if (experienceYears >= 3) {
            return 'mid';
        } else {
            return 'junior';
        }
    }

    /**
     * Extract primary job roles from resume
     * @param {Object} resume - Resume object
     * @returns {Array} List of job roles
     */
    static extractJobRoles(resume) {
        const roles = new Set();

        if (!resume) {
            return Array.from(roles);
        }

        // From experience
        if (resume.experience && Array.isArray(resume.experience)) {
            resume.experience.forEach(exp => {
                if (exp.title) {
                    roles.add(exp.title.toLowerCase());
                }
            });
        }

        // From summary
        if (resume.summary) {
            const roleKeywords = [
                'developer', 'engineer', 'analyst', 'architect', 'manager',
                'designer', 'data scientist', 'devops', 'qa', 'lead', 'director'
            ];
            const summaryLower = resume.summary.toLowerCase();
            roleKeywords.forEach(keyword => {
                if (summaryLower.includes(keyword)) {
                    roles.add(keyword);
                }
            });
        }

        return Array.from(roles);
    }

    /**
     * Extract candidate's name and contact info
     * @param {Object} resume - Resume object
     * @returns {Object} Personal information
     */
    static extractCandidateInfo(resume) {
        return {
            name: resume?.personal_info?.name || 'Unknown',
            email: resume?.personal_info?.email || '',
            phone: resume?.personal_info?.phone || '',
            location: resume?.personal_info?.location || '',
            linkedin: resume?.personal_info?.linkedin || '',
            github: resume?.personal_info?.github || ''
        };
    }

    /**
     * Helper function to extract skills from text
     * @private
     */
    static _extractSkillsFromText(text) {
        const commonTechs = [
            'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
            'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask',
            'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch',
            'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins',
            'Git', 'REST', 'GraphQL', 'SQL', 'HTML', 'CSS', 'Sass'
        ];

        const foundSkills = [];
        commonTechs.forEach(tech => {
            if (text.toLowerCase().includes(tech.toLowerCase())) {
                foundSkills.push(tech);
            }
        });

        return foundSkills;
    }

    /**
     * Validate resume structure
     * @param {Object} resume - Resume object
     * @returns {boolean} Whether resume is valid
     */
    static validateResume(resume) {
        return (
            resume &&
            typeof resume === 'object' &&
            resume.personal_info &&
            resume.skills
        );
    }
}

module.exports = ResumeService;
