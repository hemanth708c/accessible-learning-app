# Privacy Policy

**Effective Date:** 2026

At **VisionAI Accessible Learning App**, we prioritize the privacy and security of our users. Because our application is designed to assist individuals with diverse cognitive, visual, hearing, and physical needs, we handle sensitive personal interactions (such as voice interactions, handwriting analysis, and image descriptions). This policy outlines how we protect and process that data.

## 1. Information We Collect
In order to provide our accessibility features, the application interacts with the following data:
- **Audio Inputs:** When using the microphone or "Speak For Me" boards.
- **Image Inputs:** When uploading photos of messy handwriting or math equations for the AI to transcribe.
- **Text Inputs:** Direct conversations and commands given to the AI assistant.

## 2. How We Process Data (Zero Retention)
- **Local-First Processing:** Much of the user interface processing happens directly inside your web browser. The virtual file system (`virtualFs`) that stores your "voice written" and "handwriting transcribed" documents is stored entirely in memory during an active session and is wiped clean upon a hard refresh.
- **Third-Party AI Services (Google Gemini):** To transcribe handwriting or interpret complex accessibility requests, your images, audio, and text prompts are securely transmitted via API to Google Gemini. 
- **No Permanent Storage:** We do **not** permanently save your images, audio recordings, or transcriptions on our own databases. We do not use your personal accessibility requests to train proprietary models. Once Google Gemini processes the file and returns the accessible text to your screen, the transmission is complete.

## 3. Contact and Transparency
This project is fully open-source. Anyone is free to audit our `src/` directory to verify exactly how data is transmitted. If you have any concerns regarding how your special-needs data is handled, please submit an issue on our GitHub repository.

---
*Disclaimer: This is an open-source project. Users deploying their own instances of this application are responsible for securing their own API keys and managing any Supabase database schemas they connect to the application.*
