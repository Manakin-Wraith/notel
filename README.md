# Notel - A Notion-inspired Note-taking App

Notel is a modern, responsive note-taking application inspired by Notion, built with React, TypeScript, and Vite. It provides a clean, intuitive interface for organizing your notes and ideas.

![Notel Screenshot](public/notel-screenshot.png)

## Features

- 📝 Rich text editing
- 🏷️ Categorize notes with tags
- 🔍 Full-text search
- 📱 Responsive design for all devices
- ⚡ Fast and lightweight
- 🔄 Real-time updates

## Prerequisites

- Node.js (v16 or later recommended)
- npm or yarn
- Git (for version control)

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/notel.git
   cd notel
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory and add your API keys:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   You can get these keys from your Supabase project dashboard.

4. **Set up the database**:
   - Log in to your Supabase account and create a new project.
   - Go to the "SQL Editor" and run the SQL queries from the following files to set up the database schema:
     - `schema_with_events.sql`
     - `schema_sharing.sql`

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

## Usage

Once the application is running, you can start exploring its features:

- **Creating a New Page**: Click the "+" button in the sidebar to create a new page.
- **Using Block Commands**: Type `/` on a new line to open the block command menu and add different types of content.
- **Switching Views**: Use the icons in the sidebar to switch between the Agenda, Board, and Calendar views.
- **Managing Events**: Create new events, view event details, and manage your schedule from the Calendar or Agenda view.
- **Command Palette**: Press `Ctrl/Cmd + K` to open the command palette for quick navigation and actions.

### Google Sign-In

- **Sign in with Google**: Click the "Sign in with Google" button on the login page to authenticate with your Google account.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the app for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run the linter

## Project Structure

```
notel/
├── public/             # Static files
├── src/
│   ├── components/     # Reusable React components
│   ├── hooks/          # Custom React hooks
│   ├── styles/         # Global styles
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main App component
│   └── main.tsx        # Application entry point
├── .env.local          # Environment variables
├── index.html          # Main HTML template
├── package.json        # Project dependencies and scripts
└── tsconfig.json      # TypeScript configuration
```

## Technologies Used

- ⚛️ React 19
- 📝 TypeScript
- ⚡ Vite
- 🎨 Tailwind CSS (if applicable)
- 🔄 React Query (if applicable)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by Notion
- Built with Create React App + TypeScript
- Icons from [React Icons](https://react-icons.github.io/react-icons/)
