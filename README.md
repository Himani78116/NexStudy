# NexStudy 

Welcome to **NexStudy**! NexStudy is a platform for university students to find organized, topic-wise notes. No more chaos. Just pure, organized knowledge with a side of progress tracking to keep you sane.

---

## Features

*   **Structured Learning:** Notes are organized by Branches → Semesters → Courses → Units → Topics. It’s like a filing cabinet, but actually cool.
*   **Progress Tracking:** Keep tabs on what you've mastered and what still looks like ancient hieroglyphics.
*   **User Dashboard:** Students can track their study progress and see completed topics.
*   **Admin Dashboard:** A control panel for contributors to manage the curriculum and upload new notes.
*   **Progress Tracking:** Visual indicators to show how much of a course or unit has been completed.
*   **Secure Auth:** User accounts and data are managed through Supabase.

---

##  Tech Stack

*   **Framework:** [Next.js 16](https://nextjs.org/) (App Router) 
*   **Library:** [React](https://react.dev/) 
*   **Language:** [TypeScript](https://www.typescriptlang.org/) 
*   **Backend & Auth:** [Supabase](https://supabase.com/)
*   **Styling:** [Tailwind CSS 4](https://tailwindcss.com/) & Vanilla CSS
*   **Animations:** [Framer Motion](https://www.framer.com/motion/) 

---

## Getting Started

1.  **Fork the repository** on GitHub by clicking the "Fork" button at the top-right of the [NexStudy repo page](https://github.com/Himani78116/NexStudy).

2.  **Clone your fork:**
    ```bash
    git clone https://github.com/<your-username>/nexstudy.git
    cd nexstudy
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Set up environment variables:**
    Create a `.env` file in the root and add your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    GROQ_API_KEY = your_groq_api_key
    ```

5.  **Run the app:**
    ```bash
    npm run dev
    ```
---

## Running Tests

This project uses **Jest** with **React Testing Library** for unit tests. All test files are located in the `__tests__/` directory.

### 1. Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (v18 or later) and npm installed.

```bash
node --version   # Should be v18+
npm --version    # Should be v9+
```

### 2. Install Dependencies

If you haven't already, install all project dependencies including the test libraries:

```bash
npm install
```

This installs everything needed — Jest, ts-jest, React Testing Library, and all type definitions.

### 3. Run the Tests

Run all tests once:

```bash
npm test
```

Run tests in watch mode (re-runs automatically when files change):

```bash
npm run test:watch
```

Run tests with verbose output (shows each test name):

```bash
npx jest --verbose
```

Run a specific test file:

```bash
npx jest dashboard
npx jest login
npx jest navbar
```

### 4. What Gets Tested

| Test File | What It Covers |
|-----------|----------------|
| `__tests__/dashboard.test.tsx` | Auth redirects, admin/student views, logout functionality, progress display, empty states |
| `__tests__/login.test.tsx` | Form rendering, successful login, failed login errors, navigation to signup |
| `__tests__/signup.test.tsx` | Form rendering, successful signup flow, failed signup errors, navigation to login |
| `__tests__/navbar.test.tsx` | Logo rendering, login/signup button navigation |

### 5. Test Output Example

```
PASS  __tests__/navbar.test.tsx
PASS  __tests__/login.test.tsx
PASS  __tests__/signup.test.tsx
PASS  __tests__/dashboard.test.tsx

Test Suites: 4 passed, 4 total
Tests:       35 passed, 35 total
```

---

## Project Structure

Below is the project structure to help you navigate the codebase:

```text
nexstudy/
├── __tests__/          # Unit tests (Jest + React Testing Library)
│   ├── dashboard.test.tsx
│   ├── fileMock.ts
│   ├── login.test.tsx
│   ├── navbar.test.tsx
│   ├── setup.ts
│   ├── signup.test.tsx
│   └── styleMock.ts
├── src/
│   ├── app/                    # Routes and Pages (Next.js App Router)
│   │   ├── admin/              # Admin Dashboard Area
│   │   │   ├── layout.tsx      # Admin-specific layout
│   │   │   ├── page.tsx        # Admin main dashboard page
│   │   │   ├── branches/       # Manage academic branches
│   │   │   ├── courses/        # Manage courses
│   │   │   ├── semester/       # Manage individual semesters
│   │   │   ├── semesters/      # Semester overview/management
│   │   │   ├── topics/         # Manage topics
│   │   │   └── units/          # Manage units
│   │   ├── api/                # API routes (Next.js Route Handlers)
│   │   │   └── ai/
│   │   │       ├── doubt-solve/route.ts   # AI doubt solver
│   │   │       └── summarize/route.ts     # AI summarizer
│   │   ├── courses/[semId]/    # List of courses for a specific semester
│   │   ├── dashboard/          # User Progress Dashboard
│   │   ├── login/              # Login page
│   │   ├── notes/[topicId]/    # View specific topic notes
│   │   ├── semester/[branchId]/# Semester selection for a branch
│   │   ├── setup/              # User profile setup page
│   │   ├── signup/             # Signup page
│   │   ├── topics/[unitId]/    # List of topics within a unit
│   │   └── units/[courseId]/   # List of units within a course
|   |   |__ layout.tsx          # Landing page layout
|   |   |__ page.tsx            # Landing page 
│   ├── assets/         # Fonts, Images, and eye-candy
│   ├── components/     # Reusable UI bricks (Navbar, Footer, etc.)
│   ├── hooks/          # Custom React hooks (like useAdminCrud)
│   ├── lib/            # Supabase clients and shared logic
│   ├── styles/         # Global and modular CSS
│   └── types/          # TypeScript definitions
```

---

## Contributing
We love contributors! Whether you're fixing a typo or building a whole new feature, here's how you can help:

1.  **Fork the repo** 
2.  **Create your feature branch** (`git checkout -b <branch-name>`)
3.  **Commit your changes** (`git commit -m 'Add some feature'`)
4.  **Push to the branch** (`git push origin <branch-name`)
5.  **Open a Pull Request** 

Refer to `AGENTS.md` and `CLAUDE.md` for coding standards and AI-assisted development instructions.

---

## License

This project is licensed under the MIT License.

---

## Contact

Feel free to reach out if you have any questions.

**Happy Studying!**
