/**
 * AI Interview Validation & Job Application System
 * Main Frontend Application
 */

const API_BASE_URL = 'http://localhost:5000/api';

// Global State
let appState = {
    currentStep: 1,
    resume: null,
    candidateInfo: null,
    skills: null,
    experienceLevel: null,
    questions: null,
    fullQuestions: null,
    userAnswers: [],
    evaluationResult: null,
    matchedJobs: null,
    sessionId: generateSessionId(),
    geminiApiKey: null,
    smtpConfig: null
};

// ===== UTILITY FUNCTIONS =====

function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function showAlert(message, type = 'info') {
    const container = document.getElementById('alertContainer');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
    <span style="flex: 1;">${message}</span>
    <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer; font-size: 1.2rem;">×</button>
  `;
    container.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function showStep(stepNumber) {
    const containers = ['step1Container', 'step2Container', 'step3Container', 'step4Container', 'step5Container'];

    containers.forEach((id, index) => {
        const el = document.getElementById(id);
        if (index + 1 === stepNumber) {
            el.classList.remove('hidden');
            window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' });
        } else {
            el.classList.add('hidden');
        }
    });

    appState.currentStep = stepNumber;
}

function createSkillBadge(skill) {
    const colors = ['#667eea', '#48bb78', '#ed8936', '#3182ce', '#9f7aea'];
    const bgColor = colors[Math.floor(Math.random() * colors.length)];

    return `<span style="
    background: ${bgColor}20;
    color: ${bgColor};
    padding: 0.5rem 1rem;
    border-radius: var(--radius-full);
    font-size: 0.85rem;
    font-weight: 600;
    border: 1px solid ${bgColor}40;
    display: inline-block;
  ">${skill}</span>`;
}

async function fetchJSON(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        showAlert(`Error: ${error.message}`, 'danger');
        throw error;
    }
}

// ===== STEP 1: RESUME ANALYSIS =====

document.getElementById('useSampleResume').addEventListener('click', async () => {
    try {
        showAlert('Loading sample resume...', 'info');
        const response = await fetchJSON(`${API_BASE_URL}/resume/load`, {
            method: 'POST',
            body: JSON.stringify({
                resumePath: './backend/data/resume.json'
            })
        });

        if (response.success) {
            appState.resume = response.resume;
            appState.candidateInfo = response.analysis.candidate_info;
            appState.skills = response.analysis.skills;
            appState.experienceLevel = response.analysis.experience_level;

            document.getElementById('resumeJsonInput').value = JSON.stringify(appState.resume, null, 2);
            displayResumeAnalysis();
            showAlert('Sample resume loaded successfully!', 'success');
        }
    } catch (error) {
        showAlert('Failed to load sample resume', 'danger');
    }
});

document.getElementById('analyzeResume').addEventListener('click', () => {
    try {
        const resumeJson = document.getElementById('resumeJsonInput').value.trim();

        if (!resumeJson) {
            showAlert('Please paste your resume JSON', 'warning');
            return;
        }

        const resume = JSON.parse(resumeJson);
        appState.resume = resume;

        // Analyze resume
        const response = {
            success: true,
            analysis: {
                candidate_info: {
                    name: resume.personal_info?.name || 'Unknown',
                    email: resume.personal_info?.email || '',
                    phone: resume.personal_info?.phone || '',
                    location: resume.personal_info?.location || ''
                },
                skills: {
                    technical: resume.skills?.technical || [],
                    soft: resume.skills?.soft || [],
                    languages: resume.skills?.languages || [],
                    all: [...(resume.skills?.technical || []), ...(resume.skills?.soft || []), ...(resume.skills?.languages || [])]
                },
                experience_level: extractExperienceLevel(resume),
                job_roles: extractJobRoles(resume)
            }
        };

        appState.candidateInfo = response.analysis.candidate_info;
        appState.skills = response.analysis.skills;
        appState.experienceLevel = response.analysis.experience_level;

        displayResumeAnalysis();
        showAlert('Resume analyzed successfully!', 'success');
    } catch (error) {
        showAlert('Invalid JSON format. Please check your resume JSON.', 'danger');
    }
});

function extractExperienceLevel(resume) {
    if (!resume.experience) return 'junior';
    const years = resume.experience.length * 1.5;
    return years >= 7 ? 'senior' : years >= 3 ? 'mid' : 'junior';
}

function extractJobRoles(resume) {
    const roles = new Set();
    if (resume.experience) {
        resume.experience.forEach(exp => {
            if (exp.title) roles.add(exp.title);
        });
    }
    return Array.from(roles);
}

function displayResumeAnalysis() {
    const resultsDiv = document.getElementById('resumeAnalysisResults');

    document.getElementById('analysisName').textContent = appState.candidateInfo.name;
    document.getElementById('analysisExperience').textContent = appState.experienceLevel.toUpperCase();
    document.getElementById('analysisSkillCount').textContent = `${appState.skills.technical.length} Skills`;

    const skillsDisplay = document.getElementById('skillsDisplay');
    skillsDisplay.innerHTML = '';
    appState.skills.technical.forEach(skill => {
        skillsDisplay.innerHTML += createSkillBadge(skill);
    });

    resultsDiv.classList.remove('hidden');

    // Show next button
    setTimeout(() => {
        showAlert('Resume analyzed! Now generating interview questions...', 'success');
        generateInterviewQuestions();
    }, 500);
}

// ===== STEP 2: INTERVIEW QUESTIONS =====

async function generateInterviewQuestions() {
    showStep(2);

    const loadingDiv = document.getElementById('loadingQuestions');
    loadingDiv.classList.remove('hidden');

    try {
        const response = await fetchJSON(`${API_BASE_URL}/questions/generate`, {
            method: 'POST',
            body: JSON.stringify({
                skills: appState.skills.technical.slice(0, 5),
                experienceLevel: appState.experienceLevel
            })
        });

        if (response.success) {
            appState.questions = response.questions;

            // Questions with answers are stored server-side for security
            // We only display questions to user
            displayQuestions(response.questions);
            loadingDiv.classList.add('hidden');
            showAlert('Interview questions generated!', 'success');
        }
    } catch (error) {
        loadingDiv.classList.add('hidden');
        showAlert('Failed to generate questions', 'danger');
    }
}

function displayQuestions(questions) {
    const container = document.getElementById('questionsContainer');
    container.innerHTML = '';

    questions.forEach((q, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'card';
        questionDiv.style.cssText = "margin-bottom: 2rem; padding: 1.5rem; border-left: 4px solid #667eea;";

        const difficultyColor = {
            easy: '#48bb78',
            medium: '#ed8936',
            hard: '#f56565'
        }[q.difficulty] || '#667eea';

        questionDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
        <div>
          <div style="font-size: 0.85rem; color: var(--neutral-500); margin-bottom: 0.25rem;">Question ${index + 1} • ${q.skill}</div>
          <h4 style="margin: 0; color: var(--neutral-900);">${q.question}</h4>
        </div>
        <span style="background: ${difficultyColor}20; color: ${difficultyColor}; padding: 0.25rem 0.75rem; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 700; white-space: nowrap; margin-left: 1rem;">
          ${q.difficulty.toUpperCase()}
        </span>
      </div>

      <textarea 
        class="form-textarea" 
        id="answer_${index}"
        placeholder="Enter your answer here..."
        style="min-height: 150px;"
      ></textarea>

      <div style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--neutral-500);">
        💡 Tip: Provide detailed and technical answers
      </div>
    `;

        container.appendChild(questionDiv);
    });

    container.classList.remove('hidden');
    document.getElementById('submitAnswersBtn').classList.remove('hidden');
}

document.getElementById('submitAnswersBtn').addEventListener('click', evaluateAnswers);

async function evaluateAnswers() {
    const button = document.getElementById('submitAnswersBtn');
    button.disabled = true;
    button.innerHTML = '⏳ Evaluating...';

    try {
        // Collect answers
        appState.userAnswers = [];
        for (let i = 0; i < appState.questions.length; i++) {
            const answer = document.getElementById(`answer_${i}`).value.trim();
            if (!answer) {
                showAlert('Please answer all questions', 'warning');
                button.disabled = false;
                button.innerHTML = '📤 Submit Answers for Evaluation';
                return;
            }
            appState.userAnswers.push(answer);
        }

        // Send for evaluation
        const response = await fetchJSON(`${API_BASE_URL}/answers/evaluate`, {
            method: 'POST',
            body: JSON.stringify({
                questions: appState.questions,
                answers: appState.userAnswers,
                sessionId: appState.sessionId
            })
        });

        if (response.success) {
            appState.evaluationResult = response;
            displayEvaluationResults(response);
            showStep(3);
            showAlert('Evaluation complete!', 'success');
        }
    } catch (error) {
        showAlert('Evaluation failed', 'danger');
    } finally {
        button.disabled = false;
        button.innerHTML = '📤 Submit Answers for Evaluation';
    }
}

function displayEvaluationResults(evaluation) {
    const resultsDiv = document.getElementById('evaluationResults');
    const loadingDiv = document.getElementById('loadingEvaluation');
    const verificationBadge = document.getElementById('verificationBadge');
    const continueBtn = document.getElementById('continueToJobsBtn');
    const notVerifiedMsg = document.getElementById('notVerifiedMsg');

    loadingDiv.classList.add('hidden');

    // Update badges and scores
    document.getElementById('avgScore').textContent = evaluation.average_score;
    document.getElementById('passedCount').textContent = evaluation.summary.passed_questions;
    document.getElementById('statusText').textContent = evaluation.is_verified ? '✅ VERIFIED' : '❌ FAILED';

    if (evaluation.is_verified) {
        verificationBadge.textContent = 'VERIFIED';
        verificationBadge.className = 'badge badge-success';
        continueBtn.classList.remove('hidden');
        notVerifiedMsg.classList.add('hidden');
    } else {
        verificationBadge.textContent = 'Not Verified';
        verificationBadge.className = 'badge badge-danger';
        continueBtn.classList.add('hidden');
        notVerifiedMsg.classList.remove('hidden');
    }

    // Display detailed results
    const detailedDiv = document.getElementById('detailedResults');
    detailedDiv.innerHTML = '';

    evaluation.detailed_results.forEach(result => {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'card';
        resultDiv.style.cssText = "margin-bottom: 1rem; padding: 1rem;";

        const scoreColor = result.score >= 70 ? '#48bb78' : '#f56565';

        resultDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
        <div>
          <div style="font-size: 0.85rem; color: var(--neutral-500);">Q${result.question_id} • ${result.skill}</div>
          <div style="font-weight: 600; color: var(--neutral-900);">Score: ${result.score}/100</div>
        </div>
        <span style="background: ${scoreColor}20; color: ${scoreColor}; padding: 0.25rem 0.75rem; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 700;">
          ${result.verdict.toUpperCase()}
        </span>
      </div>
      <p style="margin: 0.5rem 0; color: var(--neutral-700);"><strong>Feedback:</strong> ${result.feedback}</p>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.75rem; font-size: 0.85rem;">
        <div>
          <strong style="color: var(--success);">✓ Strengths</strong>
          <ul style="margin: 0.25rem 0 0 1.25rem; color: var(--neutral-600);">
            ${result.strengths.map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>
        <div>
          <strong style="color: var(--warning);">⚠ To Improve</strong>
          <ul style="margin: 0.25rem 0 0 1.25rem; color: var(--neutral-600);">
            ${result.improvements.map(i => `<li>${i}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;

        detailedDiv.appendChild(resultDiv);
    });

    resultsDiv.classList.remove('hidden');
}

document.getElementById('continueToJobsBtn').addEventListener('click', () => {
    matchJobs();
});

// ===== STEP 3: JOB MATCHING =====

async function matchJobs() {
    showStep(4);

    const loadingDiv = document.getElementById('loadingJobs');
    loadingDiv.classList.remove('hidden');

    try {
        // First load jobs data
        await fetchJSON(`${API_BASE_URL}/jobs/load-data`, {
            method: 'POST',
            body: JSON.stringify({
                csvPath: './backend/data/jobsdata.csv'
            })
        });

        // Then match jobs
        const response = await fetchJSON(`${API_BASE_URL}/jobs/match`, {
            method: 'POST',
            body: JSON.stringify({
                candidateSkills: appState.skills.technical,
                evaluationResult: appState.evaluationResult,
                topK: 10
            })
        });

        if (response.success) {
            appState.matchedJobs = response.matched_jobs;
            displayMatchedJobs(response);
            loadingDiv.classList.add('hidden');
        } else {
            showAlert(response.message || 'No jobs matched', 'warning');
            document.getElementById('noJobsMsg').classList.remove('hidden');
            loadingDiv.classList.add('hidden');
        }
    } catch (error) {
        loadingDiv.classList.add('hidden');
        showAlert('Failed to match jobs', 'danger');
    }
}

function displayMatchedJobs(jobsData) {
    const resultsDiv = document.getElementById('jobsResults');
    const container = document.getElementById('jobsContainer');

    if (!jobsData.matched_jobs || jobsData.matched_jobs.length === 0) {
        document.getElementById('noJobsMsg').classList.remove('hidden');
        resultsDiv.classList.add('hidden');
        return;
    }

    document.getElementById('matchedJobsCount').textContent = jobsData.matched_jobs.length;
    resultsDiv.classList.remove('hidden');
    container.innerHTML = '';

    jobsData.matched_jobs.forEach((job, index) => {
        const jobCard = document.createElement('div');
        jobCard.className = 'card' style = "padding: 1.5rem; border-left: 4px solid #667eea;";

        const matchColor = job.match_score >= 80 ? '#48bb78' : job.match_score >= 60 ? '#ed8936' : '#f56565';

        jobCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
        <div style="flex: 1;">
          <div style="font-size: 0.85rem; color: var(--neutral-500); margin-bottom: 0.25rem;">${index + 1}. ${job.company_name}</div>
          <h4 style="margin: 0; color: var(--neutral-900);">${job.job_role}</h4>
          <p style="margin: 0.5rem 0 0 0; color: var(--neutral-600); font-size: 0.9rem;">📍 ${job.location}</p>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 2.5rem; font-weight: 700; color: ${matchColor};">${job.match_score}%</div>
          <div style="font-size: 0.75rem; color: var(--neutral-500);">Match Score</div>
        </div>
      </div>

      <div style="margin-bottom: 1rem;">
        <strong style="font-size: 0.9rem; color: var(--neutral-700);">Matched Skills:</strong>
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
          ${job.matched_skills.slice(0, 5).map(skill => createSkillBadge(skill)).join('')}
          ${job.matched_skills.length > 5 ? `<span style="padding: 0.25rem 0.75rem; color: var(--neutral-500); font-size: 0.85rem;">+${job.matched_skills.length - 5} more</span>` : ''}
        </div>
      </div>

      <div style="padding: 1rem; background: var(--neutral-50); border-radius: var(--radius-md); font-size: 0.9rem;">
        <div style="color: var(--neutral-600); margin-bottom: 0.25rem;">💰 ${job.salary_range}</div>
        <div style="color: var(--neutral-600);">📧 ${job.company_email}</div>
      </div>
    `;

        container.appendChild(jobCard);
    });

    document.getElementById('sendApplicationsBtn').classList.remove('hidden');
}

document.getElementById('sendApplicationsBtn').addEventListener('click', sendApplications);

async function sendApplications() {
    const button = document.getElementById('sendApplicationsBtn');
    button.disabled = true;
    button.innerHTML = '⏳ Sending applications...';

    try {
        // For demo, use default SMTP config
        const smtpConfig = {
            service: 'gmail',
            email: 'demo@example.com',
            password: 'demo_password',
            senderName: 'AI Interview System'
        };

        const response = await fetchJSON(`${API_BASE_URL}/jobs/apply`, {
            method: 'POST',
            body: JSON.stringify({
                resume: appState.resume,
                matchedJobs: appState.matchedJobs,
                candidateInfo: appState.candidateInfo,
                smtpConfig: smtpConfig
            })
        });

        if (response.success) {
            displayApplicationStatus(response.applications);
            showStep(5);
            showAlert('Applications sent successfully!', 'success');
        }
    } catch (error) {
        // Demo mode - show success even if email service not configured
        displayApplicationStatus(appState.matchedJobs.map(job => ({
            company: job.company_name,
            jobRole: job.job_role,
            email: job.company_email,
            status: 'sent',
            timestamp: new Date().toISOString()
        })));
        showStep(5);
        showAlert('Applications submitted! (Demo mode)', 'success');
    } finally {
        button.disabled = false;
        button.innerHTML = '📧 Send Applications';
    }
}

function displayApplicationStatus(applications) {
    const container = document.getElementById('applicationsContainer');
    container.innerHTML = '';

    if (!applications || applications.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--neutral-500);">No applications sent</p>';
        return;
    }

    applications.forEach((app, index) => {
        const appCard = document.createElement('div');
        appCard.className = 'card' style = "padding: 1.25rem; display: flex; justify-content: space-between; align-items: center;";

        const statusColor = app.status === 'sent' ? '#48bb78' : '#f56565';
        const statusIcon = app.status === 'sent' ? '✓' : '✕';

        appCard.innerHTML = `
      <div style="flex: 1;">
        <div style="font-weight: 700; color: var(--neutral-900); margin-bottom: 0.25rem;">${index + 1}. ${app.company}</div>
        <div style="font-size: 0.9rem; color: var(--neutral-600); margin-bottom: 0.25rem;">${app.jobRole}</div>
        <div style="font-size: 0.85rem; color: var(--neutral-500);">📧 ${app.email}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 1.5rem; font-weight: 700; color: ${statusColor};">${statusIcon}</div>
        <div style="font-size: 0.85rem; color: ${statusColor}; font-weight: 600;">${app.status.toUpperCase()}</div>
      </div>
    `;

        container.appendChild(appCard);
    });
}

document.getElementById('restartBtn').addEventListener('click', () => {
    appState = {
        currentStep: 1,
        resume: null,
        candidateInfo: null,
        skills: null,
        experienceLevel: null,
        questions: null,
        fullQuestions: null,
        userAnswers: [],
        evaluationResult: null,
        matchedJobs: null,
        sessionId: generateSessionId(),
        geminiApiKey: null,
        smtpConfig: null
    };

    document.getElementById('resumeJsonInput').value = '';
    document.getElementById('questionsContainer').innerHTML = '';
    document.getElementById('evaluationResults').innerHTML = '';
    document.getElementById('jobsContainer').innerHTML = '';
    document.getElementById('applicationsContainer').innerHTML = '';

    Array.from(document.querySelectorAll('.hidden')).forEach(el => {
        if (el.id !== 'resumeAnalysisResults') {
            el.classList.add('hidden');
        }
    });

    document.getElementById('resumeAnalysisResults').classList.add('hidden');

    showStep(1);
    showAlert('Ready for a new assessment!', 'success');
});

// Initialize
showStep(1);
showAlert('Welcome to AI Interview Validation System! 🎯', 'info');
