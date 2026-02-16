# Cenly AI 🚀

Cenly is a next-generation AI-powered platform that transforms your ideas and images into fully functional Next.js projects. Built with **Next.js 14**, **Gemini 2.0**, and **Supabase**, Cenly offers a seamless bridge between conceptual design and production-ready code.

![Hero Image Mockup](https://raw.githubusercontent.com/username/cenly/main/public/preview-image.png) _(Note: Add your actual preview image URL here)_

## ✨ Key Features

### 💻 AI Generation & Live Preview

- **Text-to-Code:** Generate complete web pages and components from simple natural language prompts.
- **Image-to-Code:** Upload up to 5 images (UI mockups, hand-drawn sketches) and watch Cenly turn them into clean code.
- **Sandpack Integration:** Instantly preview your generated code in a live, interactive environment.
- **Auto-Fix:** Detected errors in code are highlighted and can be fixed by the AI with a single click.

### 📁 Project Management

- **Dashboard:** Organize your creations with a modern sidebar that supports pinning, favoriting, renaming, and duplicating projects.
- **History:** Access previous versions and chat history for every project.
- **Ready-to-Run Export:** Pro users can download their entire project as a ZIP file, pre-configured with `package.json`, Tailwind CSS, and Framer Motion.

### 🎙️ Advanced Capabilities (Pro)

- **Voice-to-Text:** Describe your UI ideas using voice commands.
- **Multi-Image Support:** High-fidelity generation using multiple reference images simultaneously.
- **Account Tiers:** Flexible Standard and Pro plans with specialized limits and features.

---

## 🛠️ Tech Stack

- **Frontend:** [Next.js 14](https://nextjs.org/) (App Router), [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/).
- **AI Engine:** [Google Gemini 2.0 API](https://ai.google.dev/).
- **Backend/Auth:** [Supabase](https://supabase.com/).
- **Preview Engine:** [@codesandbox/sandpack-react](https://sandpack.codesandbox.io/).
- **Icons:** [Lucide React](https://lucide.dev/).
- **Utilities:** [JSZip](https://stuk.github.io/jszip/), [File-Saver](https://github.com/eligrey/FileSaver.js/), [UUID](https://github.com/uuidjs/uuid).

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/cenly.git
cd cenly
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env.local` file in the root directory and add the following:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### 4. Database Setup

Run the SQL commands found in `SUPABASE.sql` (or the script provided in the documentation) in your **Supabase SQL Editor** to initialize the tables, RLS policies, and triggers.

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start building.

---

## 📊 Account Tiers

| Feature                | Standard (Free) | Professional (Pro) |
| :--------------------- | :-------------- | :----------------- |
| Projects Limit         | 5 Projects      | Unlimited          |
| Image Uploads          | 5 Images / Day  | Unlimited          |
| Voice-to-Text          | ❌              | ✅                 |
| Project (ZIP) Download | ❌              | ✅                 |
| Response Speed         | Standard        | Priority           |

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

Built with ❤️ by [Your Name/Team]
