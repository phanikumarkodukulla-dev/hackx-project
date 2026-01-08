/**
 * Email Service
 * Handles sending application emails with resume
 */

const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const path = require('path');

class EmailService {
    constructor(smtpConfig) {
        this.smtpConfig = smtpConfig;
        this.transporter = nodemailer.createTransport({
            service: smtpConfig.service,
            auth: {
                user: smtpConfig.email,
                pass: smtpConfig.password
            }
        });
    }

    /**
     * Generate professional resume PDF
     * @param {Object} resume - Resume data object
     * @returns {Buffer} PDF buffer
     */
    generateResumePDF(resume) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 50
                });

                let buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    resolve(Buffer.concat(buffers));
                });

                // Header
                doc.fontSize(24).font('Helvetica-Bold').text(
                    resume.personal_info?.name || 'Candidate Name',
                    { align: 'center' }
                );

                // Contact Info
                const contact = [
                    resume.personal_info?.email,
                    resume.personal_info?.phone,
                    resume.personal_info?.location
                ].filter(Boolean).join(' • ');

                doc.fontSize(10).font('Helvetica').text(contact, { align: 'center' });
                doc.moveDown(0.5);

                // Summary
                if (resume.summary) {
                    doc.fontSize(12).font('Helvetica-Bold').text('SUMMARY');
                    doc.fontSize(10).font('Helvetica').text(resume.summary);
                    doc.moveDown(0.5);
                }

                // Skills
                if (resume.skills) {
                    doc.fontSize(12).font('Helvetica-Bold').text('SKILLS');
                    const allSkills = [
                        ...(resume.skills.technical || []),
                        ...(resume.skills.soft || []),
                        ...(resume.skills.languages || [])
                    ].join(', ');
                    doc.fontSize(10).font('Helvetica').text(allSkills);
                    doc.moveDown(0.5);
                }

                // Experience
                if (resume.experience && resume.experience.length > 0) {
                    doc.fontSize(12).font('Helvetica-Bold').text('EXPERIENCE');
                    resume.experience.slice(0, 3).forEach(exp => {
                        doc.fontSize(11).font('Helvetica-Bold').text(exp.title);
                        doc.fontSize(10).font('Helvetica').text(
                            `${exp.company} • ${exp.location || ''} • ${exp.start_date || ''} - ${exp.end_date || ''}`
                        );
                        if (exp.description) {
                            exp.description.slice(0, 2).forEach(desc => {
                                doc.fontSize(9).text(`• ${desc}`);
                            });
                        }
                        doc.moveDown(0.3);
                    });
                }

                // Education
                if (resume.education && resume.education.length > 0) {
                    doc.fontSize(12).font('Helvetica-Bold').text('EDUCATION');
                    resume.education.forEach(edu => {
                        doc.fontSize(11).font('Helvetica-Bold').text(edu.degree);
                        doc.fontSize(10).font('Helvetica').text(
                            `${edu.institution} • ${edu.graduation_date || ''}`
                        );
                        doc.moveDown(0.3);
                    });
                }

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Send application email
     * @param {Object} emailData - Email configuration
     * @param {string} emailData.to - Recipient email
     * @param {string} emailData.candidateName - Candidate name
     * @param {string} emailData.jobRole - Applied job role
     * @param {string} emailData.companyName - Company name
     * @param {Buffer} resumePDF - Resume PDF buffer
     * @returns {Promise<Object>} Email send result
     */
    async sendApplicationEmail(emailData, resumePDF) {
        const { to, candidateName, jobRole, companyName } = emailData;

        const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; color: white; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">Application Submission</h2>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">Job Application Platform</p>
      </div>

      <div style="padding: 30px; background-color: #f8f9fa; border: 1px solid #e9ecef;">
        <p>Dear Hiring Team at <strong>${companyName}</strong>,</p>

        <p>I am writing to express my interest in the <strong>${jobRole}</strong> position at your esteemed organization.</p>

        <p>With my technical expertise and professional experience, I am confident that I can contribute significantly to your team. Please find my resume attached for your review.</p>

        <p>I would welcome the opportunity to discuss how my skills and experience align with your team's needs.</p>

        <p>Thank you for considering my application. I look forward to hearing from you.</p>

        <p style="margin-bottom: 5px;">Best regards,</p>
        <p style="margin: 0;"><strong>${candidateName}</strong></p>
      </div>

      <div style="padding: 20px; background-color: #e9ecef; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; text-align: center;">
        <p style="margin: 0;">This email was sent by AI Interview Validation System</p>
      </div>
    </div>
    `;

        try {
            const info = await this.transporter.sendMail({
                from: `"${this.smtpConfig.senderName}" <${this.smtpConfig.email}>`,
                to: to,
                subject: `Application for ${jobRole} Position`,
                html: htmlContent,
                attachments: [
                    {
                        filename: `${candidateName}_Resume.pdf`,
                        content: resumePDF,
                        contentType: 'application/pdf'
                    }
                ]
            });

            return {
                success: true,
                messageId: info.messageId,
                to: to,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            throw new Error(`Failed to send email to ${to}: ${error.message}`);
        }
    }

    /**
     * Send batch applications
     * @param {Array} matchedJobs - Array of matched jobs
     * @param {Object} candidateInfo - Candidate information
     * @param {Buffer} resumePDF - Resume PDF buffer
     * @returns {Promise<Array>} Results of all email sends
     */
    async sendBatchApplications(matchedJobs, candidateInfo, resumePDF) {
        const results = [];

        for (const job of matchedJobs) {
            try {
                const result = await this.sendApplicationEmail(
                    {
                        to: job.company_email,
                        candidateName: candidateInfo.name,
                        jobRole: job.job_role,
                        companyName: job.company_name
                    },
                    resumePDF
                );

                results.push({
                    company: job.company_name,
                    jobRole: job.job_role,
                    email: job.company_email,
                    status: 'sent',
                    timestamp: result.timestamp
                });
            } catch (error) {
                results.push({
                    company: job.company_name,
                    jobRole: job.job_role,
                    email: job.company_email,
                    status: 'failed',
                    error: error.message
                });
            }

            // Add delay between emails to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return results;
    }
}

module.exports = EmailService;
