<img src="public/logo.svg" alt="greenplate-app" width=200 />
<h1>GreenPlate</h1>
<p><strong>Vegetarian recipe discovery, fridge matching, and PDF cookbook generation</strong></p>

---

## 👀 Overview

GreenPlate is a responsive web application for discovering and organizing vegetarian recipes. Users can search the Spoonacular recipe database, find dishes based on ingredients already available at home, save favorite recipes, and generate downloadable PDF cookbooks.

---

## ⚡ Key Features

### Recipe Discovery

- Search vegetarian recipes from the Spoonacular API
- Receive live search suggestions through autocomplete
- Browse recipe images, ingredients, and preparation instructions
- Open detailed recipe views

### Fridge Matcher

- Enter ingredients currently available at home
- Find recipes that use those ingredients
- Compare ingredient matches and missing ingredients
- Sort results according to match relevance

### Favorites & Offline Resilience

- Save recipes for later access and preserve collections across sessions
- Two-tier caching layer (`localStorage` + Upstash Redis) to gracefully handle API quota limits (HTTP 402/429)
- Use saved recipes to create a custom cookbook

### PDF Cookbook Generator

- Export an individual recipe as a PDF
- Combine up to 30 favorite recipes into one cookbook
- Automatically format recipe titles, ingredients, and instructions
- Generate multi-page documents using jsPDF

---

## 🛠 Tech Stack

- **Frontend:** React 18, JavaScript, HTML5, CSS3
- **Build Tool:** Vite
- **HTTP Client:** Axios
- **Serverless Backend:** Vercel Serverless Functions (`api/spoonacular.js`)
- **Database / Quota Enforcement:** Upstash Redis (REST API)
- **Recipe Data:** Spoonacular API
- **PDF Generation:** jsPDF
- **Persistence:** Browser LocalStorage
- **Deployment:** Vercel

---

## 💻 Getting Started

Get GreenPlate running locally in just a few minutes.

### Prerequisites

Make sure the following are installed:

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/)
- [Vercel CLI](https://vercel.com/docs/cli) (required for local serverless functions and Redis integration)

Install the Vercel CLI:

```bash
npm install -g vercel
```

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/YOUR_USERNAME/greenplate.git
cd greenplate
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
SPOONACULAR_API_KEY=your_spoonacular_api_key
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_rest_token
```

### Running the Application

#### Full-Stack Development (Recommended)

Starts the React frontend together with local Vercel serverless functions and Upstash Redis integration.

```bash
npm run vercel:dev
```

Open the application at:

```text
http://localhost:3000
```

Ideal for testing:

- Recipe search and autocomplete
- Spoonacular API integration
- Redis caching
- Rate limiting and quota handling
- End-to-end application functionality

#### Frontend-Only Development

Starts the Vite development server without backend services.

```bash
npm run dev
```

Open the application at:

```text
http://localhost:5173
```

Ideal for:

- UI development
- Styling and layout updates
- Component development
- Offline testing
- Rapid frontend iteration

### Available Scripts

```bash
npm run dev          # Start Vite development server
npm run vercel:dev   # Start local full-stack environment
npm run build        # Create production build
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
npm run test         # Run test suite
npm run test:watch   # Run tests in watch mode
```

---

## 📁 Project Architecture

```text
greenplate/
├── api/
│   └── spoonacular.js       # Serverless API proxy & Upstash quota limit
├── public/                  # Public assets and logo images
│   ├── flg-signature.svg
│   └── logo.svg
├── src/
│   ├── __mocks__/           # Mock data for testing
│   ├── api/                 # API communication layer
│   ├── components/          # Reusable interface components plus tests
│   ├── context/             # React Context providers
│   ├── hooks/               # Custom React hooks
│   ├── pages/               # Application page views
│   ├── styles/              # Global and component styles
│   ├── utils/               # Cache, quota, and PDF generator utilities
│   ├── App.jsx
│   ├── main.jsx
│   └── setupTests.jsx
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
└── vite.config.js
```

---

## 🎥 Live Demo

View the live application on [Vercel](https://flg-greenplate.vercel.app/).

---

## 🔐 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## 👨‍💻 Author

Developed with ❤️ by 

<img src="public/flg-signature.svg" alt="FLG — Neuroscience & Technology" width=200 />

---

## ✨ Acknowledgements

- Spoonacular for recipe data
- Upstash Redis for serverless rate limiting
- jsPDF for client-side PDF generation
- React and Vite for the frontend development environment
- Vercel for deployment and serverless functions
