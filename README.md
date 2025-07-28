# Notel - A Notion-inspired Note-taking App

Notel is a modern, responsive note-taking application inspired by Notion, built with React, TypeScript, and Vite. It provides a clean, intuitive interface for organizing your notes and ideas.

## Key Features

- **Rich Text-Editing**: Create and format notes with a variety of block types, including headings, lists, code blocks, and more.
- **Multiple Views**: Organize and visualize your notes with different views, including:
  - **Agenda**: See all your tasks and events in a chronological list.
  - **Board**: Manage your tasks with a Kanban-style board.
  - **Calendar**: View your events and deadlines in a full-page calendar.
- **Command Palette**: Quickly access commands and navigate through your pages with a powerful command palette (Ctrl/Cmd + K).
- **Notifications**: Get reminders for upcoming events and deadlines.
- **Real-time Sync**: Your notes are automatically saved and synced with Supabase.
- **Responsive Design**: Access and manage your notes on any device, with a fully responsive interface.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- **Node.js**: Make sure you have Node.js installed (v16 or later is recommended).
- **npm** or **yarn**: This project uses npm or yarn for package management.
- **Git**: You'll need Git to clone the repository.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/notel.git
   cd notel
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn
   ```

3. **Set up environment variables**:
   Create a `.env.local` file in the root directory of the project and add the following environment variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   You can get these keys from your Supabase project dashboard.

4. **Set up the database**:
   - Log in to your Supabase account and create a new project.
   - Go to the "SQL Editor" and run the SQL queries from the following files to set up the database schema:
     - `schema_with_events.sql`
     - `schema_sharing.sql`

5. **Run the development server**:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

## Usage

Once the application is running, you can start exploring its features:

- **Creating a New Page**: Click the "+" button in the sidebar to create a new page.
- **Using Block Commands**: Type `/` on a new line to open the block command menu and add different types of content.
- **Switching Views**: Use the icons in the sidebar to switch between the Agenda, Board, and Calendar views.
- **Managing Events**: Create new events, view event details, and manage your schedule from the Calendar or Agenda view.
- **Command Palette**: Press `Ctrl/Cmd + K` to open the command palette for quick navigation and actions.

## Project Structure

The project is organized as follows:

```
/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   ├── contexts/        # React contexts
│   ├── lib/             # Helper libraries and services
│   ├── types/           # TypeScript type definitions
│   ├── App.tsx          # Main application component
│   └── index.tsx        # Entry point of the application
├── supabase/            # Supabase migrations and functions
├── .env.local.example   # Example for environment variables
├── package.json         # Project dependencies and scripts
└── README.md            # This file
```

## Technologies Used

- **React**: A JavaScript library for building user interfaces.
- **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript.
- **Vite**: A fast build tool and development server for modern web projects.
- **Supabase**: An open-source Firebase alternative for building secure and scalable applications.
- **Nodemailer**: A module for Node.js to send emails.
- **Tailwind CSS**: A utility-first CSS framework for rapid UI development.

## Contributing

Contributions are welcome! If you have any ideas, suggestions, or bug reports, please open an issue or submit a pull request.

1. **Fork the repository**
2. **Create your feature branch**: `git checkout -b feature/your-feature-name`
3. **Commit your changes**: `git commit -m 'Add some feature'`
4. **Push to the branch**: `git push origin feature/your-feature-name`
5. **Open a pull request**

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Acknowledgments

- Inspired by **Notion** and other modern note-taking apps.
- Icons provided by **Heroicons**.
- Special thanks to the open-source community for their invaluable contributions.

## Contact

- **Project Link**: [https://github.com/your-username/notel](https://github.com/your-username/notel)
