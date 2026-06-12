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

1.  **Clone the project:**
    ```bash
    git clone https://github.com/your-username/nexstudy.git
    cd nexstudy
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root and add your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the app:**
    ```bash
    npm run dev
    ```

---

## Project Structure

Below is the complete structure of the `src/app` directory to help you navigate the routes:

```text
nexstudy/
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
2.  **Create your feature branch** (`git checkout -b feature/AmazingFeature`)
3.  **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4.  **Push to the branch** (`git push origin feature/AmazingFeature`)
5.  **Open a Pull Request** 

Refer to `AGENTS.md` and `CLAUDE.md` for coding standards and AI-assisted development instructions.

---

## License

This project is licensed under the MIT License.

---

## Contact

Feel free to reach out if you have any questions.

**Happy Studying! **
