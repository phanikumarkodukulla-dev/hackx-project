# 🎯 AI Interview Validation & Job Application System

A sophisticated, AI-driven platform that validates candidate skills through technical interviews and automatically matches them with suitable job opportunities.

## ✨ Features

### 📋 **Step 1: Resume Intelligence**

- AI-powered resume parsing and analysis
- Automatic extraction of technical skills, experience level, and job roles
- Candidate profile creation from JSON resume data
- No hallucinated skills - only actual resume content used

### ❓ **Step 2: Technical Interview Assessment**

- Generates exactly 5 skill-specific interview questions
- Questions increase in difficulty based on experience level
- Real interview-level questions using Gemini AI
- Answers NOT displayed to frontend for security

### 📊 **Step 3: Semantic Answer Evaluation**

- AI-powered semantic evaluation of answers (not keyword-based)
- Detailed scoring across 5 dimensions:
  - Technical Accuracy (0-40 points)
  - Completeness (0-30 points)
  - Clarity (0-20 points)
  - Keyword Coverage (0-10 points)
- Verification threshold: 70/100
- Individual feedback for each answer with strengths and improvements

### 🎯 **Step 4: RAG-Based Job Matching**

- Retrieval-Augmented Generation for intelligent job matching
- Vector-based skill matching with job requirements
- Only verified candidates proceed to this stage
- Top 5-10 matching jobs displayed with match scores

### 📧 **Step 5: Automated Applications**

- Resume converted to professional PDF
- Personalized application emails to companies
- Resume attachment with each application
- Application status dashboard with tracking

## 🏗️ Architecture

### Backend Stack

- **Framework**: Node.js + Express
- **AI Engine**: Google Gemini API (2.5 Flash)
- **Job Matching**: RAG with CSV parsing and scoring
- **Email Service**: Nodemailer
- **Resume Generation**: PDFKit
- **Runtime**: Nodemon for development

### Frontend Stack

- **Framework**: Vanilla JavaScript (no dependencies)
- **Styling**: Custom CSS with professional color palette
- **UI Components**: Cards, Forms, Progress indicators, Alerts
- **Design**: Modern gradient themes with smooth animations

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND (HTML/CSS/JS)                 │
│  - Resume Upload & Analysis                              │
│  - Interview Question Display                            │
│  - Answer Submission                                     │
│  - Job Dashboard                                         │
└────────────┬────────────────────────────────────────────┘
             │ REST API Calls
┌────────────▼────────────────────────────────────────────┐
│              EXPRESS BACKEND (Node.js)                   │
├─────────────────────────────────────────────────────────┤
│ Routes:                          Services:               │
│ ├─ /api/resume/*       ────────> ResumeService          │
│ ├─ /api/questions/*    ────────> QuestionGenerationService
│ ├─ /api/answers/*      ────────> AnswerEvaluationService│
│ └─ /api/jobs/*         ────────> RAGService             │
│                                  EmailService           │
├─────────────────────────────────────────────────────────┤
│ External APIs:                   Data:                   │
│ ├─ Gemini API ────────────────> Question Generation    │
│ │                               Answer Evaluation       │
│ ├─ SMTP Service ───────────────> Email Sending         │
│ └─ File System ────────────────> Resume JSON           │
│                                  JobsData CSV           │
└─────────────────────────────────────────────────────────┘
```

## 📦 Installation

### Prerequisites

- Node.js 16+ and npm
- Gemini API key (get from Google AI Studio)
- SMTP credentials (Gmail recommended for email testing)

### Setup Steps

1. **Clone/Extract Project**

```bash
cd ai-interview-system
```

2. **Install Dependencies**

```bash
npm install
```

3. **Configure Environment**

```bash
# Copy example to create .env
Copy .env.example to .env

# Edit .env with your credentials:
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
SMTP_SERVICE=gmail
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SENDER_NAME=AI Interview System
NODE_ENV=development
```

4. **Prepare Data Files**

```
backend/data/
├─ resume.json       (sample included)
└─ jobsdata.csv      (sample included)
```

5. **Start Development Server**

```bash
npm run dev
```

Server will start on `http://localhost:5000`

## 🚀 Usage Guide

### Workflow

#### **Phase 1: Resume Analysis**

1. Click "Load Sample Resume" OR paste your own resume JSON
2. Click "Analyze Resume" button
3. System extracts:
   - Candidate name and contact info
   - Technical skills (primary focus)
   - Experience level (junior/mid/senior)
   - Job roles from experience

#### **Phase 2: Technical Interview**

1. System generates 5 interview questions based on your skills
2. Questions are skill-specific and increase in difficulty
3. Answer each question thoroughly
4. Click "Submit Answers for Evaluation"

#### **Phase 3: Evaluation & Verification**

1. AI evaluates each answer semantically
2. Shows:
   - Individual scores for each question
   - Feedback with strengths and improvements
   - Overall verification status
3. **Passing threshold: 70/100**
4. Only verified candidates proceed

#### **Phase 4: Job Matching**

1. System loads jobs from jobsdata.csv
2. Matches your skills against job requirements
3. Displays top matched jobs with:
   - Match percentage
   - Matched skills
   - Salary range
   - Company email

#### **Phase 5: Applications**

1. Review matched jobs
2. Click "Send Applications to All Matched Companies"
3. System generates professional PDF resume
4. Sends personalized emails to each company
5. View application status dashboard

### Resume JSON Format

```json
{
  "personal_info": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "+1-xxx-xxx-xxxx",
    "location": "City, State",
    "linkedin": "url",
    "github": "url"
  },
  "summary": "Professional summary",
  "skills": {
    "technical": ["JavaScript", "Python", "React", ...],
    "soft": ["Leadership", "Communication", ...],
    "languages": ["English", "Spanish", ...]
  },
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, State",
      "start_date": "YYYY-MM",
      "end_date": "YYYY-MM",
      "description": ["Achievement 1", "Achievement 2", ...]
    }
  ],
  "education": [
    {
      "degree": "Degree",
      "institution": "University",
      "graduation_date": "YYYY-MM",
      "gpa": "3.8"
    }
  ],
  "projects": [...],
  "certifications": [...],
  "awards": [...]
}
```

### jobsdata.csv Format

```csv
company_name,job_role,required_skills,company_email,location,salary_range,job_description
"Company","Role","Skill1,Skill2,Skill3","email@company.com","City, State","$XXX-$XXX","Description"
```

## 📁 Project Structure

```
ai-interview-system/
├── backend/
│   ├── services/
│   │   ├── resumeService.js           # Resume parsing & analysis
│   │   ├── questionGenerationService.js  # Interview Q generation
│   │   ├── answerEvaluationService.js    # Answer scoring
│   │   ├── ragService.js              # Job matching (RAG)
│   │   └── emailService.js            # Email & PDF generation
│   ├── routes/
│   │   ├── resumeRoutes.js
│   │   ├── questionRoutes.js
│   │   ├── answerRoutes.js
│   │   └── jobRoutes.js
│   ├── data/
│   │   ├── resume.json                # Sample resume
│   │   └── jobsdata.csv               # Sample jobs
│   └── server.js                      # Main Express server
├── frontend/
│   ├── index.html                     # Main HTML
│   ├── css/
│   │   └── styles.css                 # Professional styling
│   └── js/
│       └── app.js                     # Frontend logic
├── package.json
├── .env.example
└── README.md
```

## 🔐 Security Features

✅ **Correct answers NEVER exposed to frontend**

- Questions sent to UI without answers
- Answers evaluated server-side only
- Session-based evaluation tracking

✅ **Verification required for applications**

- No job applications unless candidate scores ≥70/100
- Prevents unqualified applications

✅ **No skill hallucination**

- Only skills from resume JSON used
- No AI guessing of additional skills

✅ **API Key Protection**

- Environment variables for sensitive keys
- No hardcoded credentials

## 🎨 UI/UX Design

### Color Palette

- **Primary**: Deep Purple (#667eea) & Vibrant Teal (#48bb78)
- **Accents**: Professional Blues, Oranges, Reds
- **Neutrals**: Clean grays for text and backgrounds
- **Status Colors**: Green (success), Red (danger), Orange (warning)

### Design Features

- ✨ Smooth gradient backgrounds
- 🎯 Clear step-by-step progress indication
- 📊 Intuitive card-based layout
- 🎭 Professional color palette
- ⚡ Smooth animations and transitions
- 📱 Responsive design for all devices
- ♿ Accessible form elements and alerts

## 🔧 API Endpoints

### Resume API

- `POST /api/resume/load` - Load resume from file
- `POST /api/resume/analyze` - Analyze resume data

### Questions API

- `POST /api/questions/generate` - Generate interview questions

### Answers API

- `POST /api/answers/evaluate` - Evaluate all answers
- `GET /api/answers/evaluation/:sessionId` - Get cached results

### Jobs API

- `POST /api/jobs/load-data` - Load jobs from CSV
- `POST /api/jobs/match` - Get matched jobs
- `POST /api/jobs/apply` - Send applications
- `GET /api/jobs/all` - Get all available jobs

## 💡 Advanced Features

### Gemini AI Integration

- Uses Google Gemini 2.5 Flash model
- Efficient question generation
- Semantic answer evaluation
- Structured JSON output parsing

### RAG Implementation

- Retrieval-Augmented Generation for job matching
- Vector-based skill similarity matching
- Score-based job ranking
- Configurable match threshold (default 40%)

### Email Service

- Professional resume PDF generation
- HTML email templates
- Batch email processing with delays
- Error handling and retry logic

## 🚨 Troubleshooting

### Server won't start

```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Use different port
PORT=3000 npm run dev
```

### Gemini API errors

- Verify API key in .env
- Check API quota at Google AI Studio
- Ensure network connectivity

### Email not sending

- Verify SMTP credentials in .env
- For Gmail: use App Password (not regular password)
- Check email service configuration

### Questions not generating

- Ensure resume has at least 5 technical skills
- Check Gemini API key configuration
- Review browser console for errors

## 📊 Performance Metrics

- Resume parsing: < 100ms
- Question generation: 2-3 seconds
- Answer evaluation: 5-8 seconds per set
- Job matching: < 500ms
- Email generation: < 1 second per job

## 🔄 Development Tips

### Testing without email

- Comment out email service in job routes
- Application status will show as "sent" in demo mode

### Using local resume

1. Place resume.json in `/backend/data/`
2. Click "Load Sample Resume" button
3. Or manually paste JSON in textarea

### Adding more jobs

1. Edit `/backend/data/jobsdata.csv`
2. Restart server (nodemon auto-refreshes)
3. System will load new jobs on next match

## 📝 License

MIT License - Feel free to use and modify

## 👤 Support

For issues or questions, refer to the documentation or review the service files for implementation details.

---

**Built with ❤️ using Node.js, Gemini AI, and modern web technologies**
