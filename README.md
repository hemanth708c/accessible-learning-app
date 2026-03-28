# VisionAI Accessible Learning App

An open-source, fully adaptive React web application built to make digital learning accessible to everyone. 

Powered by Google Gemini 2.0 Vision and Text engines.

![App Dashboard Screenshot](src/assets/hero.png) *(Preview of the application interface)*

## The Social Cause & Problem

Digital education and SaaS platforms are historically built as a "one-size-fits-all" solution. This creates massive technological barriers, leaving millions of students and individuals excluded from equal learning opportunities. We strive for educational equity by addressing the specific barriers faced by distinct groups:

- **Vision-less (Blind and Low-Vision) Individuals:** Traditional learning heavily relies on reading long, dense visual text. Sighted interfaces and complex navigation menus are completely inaccessible for blind users.
- **Deaf and Hearing Impaired Individuals:** Video, audio-lectures, and AI dictation tools often leave deaf individuals behind. Furthermore, many digital alerts rely on auditory bell sounds, causing them to miss important cues.
- **Mute and Non-Verbal Individuals:** Individuals who cannot speak (or experience selective mutism) are entirely cut off from Voice-AI tools and digital collaboration, relying on slow typings interfaces that are difficult to use in fast-paced environments.
- **Individuals with Cognitive Disorders:** Students with Dyslexia struggle with massive blocks of text. Those with Autism (ASD) experience severe sensory overload from complex UI and struggle to decode abstract social language. Executive dysfunction in ADHD/ADD makes task-tracking nearly impossible.

When tools don't adapt to the user, the user is left behind. Our social cause is to ensure that technology bends to fit the human, not the other way around. Every individual deserves equal access to learning tools without their disability acting as a bottleneck.

## The Solution

**VisionAI Accessible Learning App** is an entirely adaptive, multi-modal educational ecosystem. Rather than offering basic "accessibility toggles," it uses Google Gemini 2.0 to dynamically rewire the interface, the text formatting, and the actual personality and intelligence of the AI assistant based on the exact combination of the user's disabilities. It acts as a customized, infinite-patience tutor.

## Future Improvements

- **Eye-Tracking Navigation:** Allowing fully paralyzed users to navigate the app via webcam gaze detection.
- **Sign-Language Avatars:** Converting AI text responses into real-time 3D sign language interpretation for Deaf individuals.
- **Offline Edge-AI Processing:** Enabling the core AI features to run locally without internet access for low-income or remote communities.

## Key Features

The VisionAI platform dynamically supports 8 distinct accessibility profiles, which can be toggled individually or stacked together for comprehensive support:
1. **Visual (Blind/Low Vision):** Uses explicit, highly descriptive screen-reader text.
2. **Hearing (Deafness):** Ensures spoken responses strictly match formatted text, backed by haptic alerts.
3. **Dyslexia:** Adapts AI vocabulary, uses short sentences, and applies Bionic Reading algorithms.
4. **Dysgraphia:** Automatically corrects spelling, grammar, and formats messy handwriting.
5. **Dyscalculia:** Converts abstract mathematical concepts into interactive, relatable storytelling.
6. **ASD (Autism Spectrum):** Decodes tone explicitly, relies on literal communication, and generates calming step-by-step Social Stories.
7. **ADHD (Focus Mode):** Eliminates fluff, utilizing extreme conciseness and bullet points.
8. **Calm Mode:** A generalized anxiety overlay providing reassuring, slow-paced, and highly empathetic language.

### Cognitive Flexibility (ADHD, ASD, Dyslexia, Dysgraphia)
- **Multi-Mode Synergies:** Toggle multiple accessibility profiles simultaneously.
- **Bionic Reading Text:** Automatically bolds the first half of words to visually guide users with reading fatigue and severe ADHD/Dyslexia.
- **Task Chunking Generator:** Magic button to instantly break lengthy reading materials into a simplified 1-2-3 literal checklist.
- **Autism (ASD) Social Decoding:** Ask the AI to literally decode the emotions of complex text or generate a calming Social Story.

### Hearing & Speech Impaired Interfaces
- **Speak For Me (AAC Quick-Board):** Instant text-to-speech phrases (e.g., "I need a break", "Repeat that") designed to give a rapid voice to non-verbal or mute users without typing.
- **Haptic Deaf Integrations:** Synchronized global vibration haptics alert users when AI processing finishes, ensuring they feel the response without hearing it.

### Physical & Vision Impairments (Single Switch)
- **Giant Global Switch:** Users don't need fine-motor skills. Tapping any non-interactive whitespace on the screen or hitting the Spacebar acts as a giant accessibility toggle for the microphone.
- **AI Hand-Writing & Math Transcription:** Upload photos of messy writing or complex equations to receive clear, organized digital text, spoken aloud via Text-to-Speech.

---

## Tech Stack
- **Frontend:** React.js, Vite, Vanilla CSS 
- **Icons:** Lucide-React
- **AI Engine:** Google Generative AI (Gemini 2.0 Flash)
- **Database:** Supabase (for user module persistence)

## Local Development Setup

We encourage open-source contributions to make education universally accessible. Here is how to spin up your own local version:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/accessible-learning-app.git
   cd accessible-learning-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Keys:**
   - Duplicate the .env.example file and rename it to .env.local.
   - Obtain a free API key from Google AI Studio.
   - Add your key to VITE_GEMINI_API_KEY.

4. **Start the application:**
   ```bash
   npm run dev
   ```

## Contributing
Contributions are what make the open-source community an amazing place to learn, inspire, and create. Any contributions you make to improve accessibility are greatly appreciated. Please read our CONTRIBUTING.md for more details.

## License
Distributed under the MIT License. See LICENSE for more information.

Disclaimer 
The project is created through vibe coding but the features and Ideas are original
