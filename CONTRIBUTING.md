# Contributing to VisionAI Accessible Learning App

Thank you for your interest in contributing! Our goal is to make learning accessible to *everyone*, regardless of their cognitive, visual, hearing, or physical abilities. 

## How You Can Help

1. **Bug Reports & Feature Requests:** Please use the GitHub Issues tab to report any bugs or suggest new accessibility overlays.
2. **Developing Features:** We welcome Pull Requests (PRs)! If you're building a major feature (like adding a new cognitive mode), please open an issue first to discuss the architecture.

## Local Development Setup

1. Fork the repository and clone it locally.
2. Run `npm install` to install dependencies.
3. Rename `.env.example` to `.env.local` and add your Gemini API Key.
4. Run `npm run dev` to start the local Vite server.

## Code Style & Architecture

- **React Architecture:** We use functional components and hooks. The core AI logic lives in `src/components/AIAssistant.jsx`.
- **Styling:** We use plain CSS in `src/styles/`. Avoid introducing new heavy utility frameworks (like Tailwind) unless strictly necessary, to ensure the custom `data-mode` cascading accessibility overrides remain intact.
- **Accessibility First:** Any new UI element *must* be keyboard-navigable and compatible with the global Spacebar single-switch interactions.

## Submitting a Pull Request

- Create a new branch: `git checkout -b feature/your-feature-name`
- Commit your changes with clear, descriptive commit messages.
- Push to your fork and submit a Pull Request to our `main` branch.

We look forward to your contributions!
