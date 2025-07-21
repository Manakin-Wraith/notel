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
   VITE_API_KEY=your_api_key_here
   # Add other environment variables as needed
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

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
