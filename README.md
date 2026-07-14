# Momentum

Momentum is an advanced AI-powered recruitment and interview preparation platform designed to streamline the hiring process for both recruiters and candidates. It leverages Google's Gemini AI to provide intelligent resume analysis, generate custom interview questions, and conduct mock interviews.

## Features

- **AI-Powered Resume Analysis**: Automatically evaluates resumes against job descriptions, providing a compatibility score and detailed feedback using Gemini AI.
- **Smart Interview System**:
  - **Mock Interviews**: Candidates can practice with AI-driven interviews that adapt to their responses.
  - **Code Editor**: Integrated Monaco editor for technical interviews.
  - **Real-time Feedback**: Instant analysis of candidate performance.
- **Recruiter Dashboard**: Comprehensive tools for recruiters to post jobs, manage applications, and view AI-generated insights.
- **Application Tracking**: Seamless management of job applications and statuses.
- **PDF Generation**: Downloadable resume analysis reports.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
- **Database**: [MongoDB](https://www.mongodb.com/) (via Mongoose)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **AI Integration**: [Google Gemini API](https://ai.google.dev/)
- **File Storage**: [Firebase](https://firebase.google.com/)

## Dependencies

This project relies on the following major dependencies:

### Core
- `next`: ^16.1.6
- `react`: ^19.2.3
- `react-dom`: ^19.2.3

### AI & Data
- `@google/generative-ai`: ^0.24.1 (Gemini AI SDK)
- `mongoose`: ^9.1.5 (MongoDB ODM)
- `firebase`: ^12.8.0

### UI & Styling
- `tailwindcss`: ^4.0.0
- `framer-motion`: ^12.29.2
- `lucide-react`: ^0.563.0 (Icons)
- `recharts`: ^3.7.0 (Data Visualization)
- `@radix-ui/*`: Headless UI primitives
- `class-variance-authority`: For component variants
- `clsx`, `tailwind-merge`: For utility class management

### Tools & Utilities
- `@monaco-editor/react`: ^4.7.0 (Code Editor)
- `next-auth`: ^4.24.13 (Authentication)
- `html2canvas`, `jspdf`: PDF generation tools
- `dotenv`: Environment variable management

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/kajaredhruv433/Momentum.git
    cd Momentum
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the root directory and add the necessary keys (MongoDB URI, Google Gemini API Key, NextAuth Secret, Firebase Config, etc.).

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  **Open the app:**
    Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint for code quality.

## License

This project is private and proprietary.
