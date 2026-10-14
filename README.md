<img src="public/logo.svg" alt="greenplate-app" width=200 />
<h1>GreenPlate</h1>
<p <strong>Vegetarian recipe discovery, fridge matching, and PDF cookbook generation</strong> </p>

---

## 👀 Overview

GreenPlate is a responsive web application for discovering and organizing vegetarian recipes.
Users can search the Spoonacular recipe database, find dishes based on ingredients already available at home, save favorite recipes, 
and generate downloadable PDF cookbooks.

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

### Favorites

- Save recipes for later access
- Remove recipes from the favorites collection
- Preserve saved recipes between sessions using browser storage
- Use saved recipes to create a custom cookbook

### PDF Cookbook Generator

- Export an individual recipe as a PDF
- Combine up to 30 favorite recipes into one cookbook
- Automatically format recipe titles, ingredients, and instructions
- Cache recipe data to reduce duplicate API requests
- Generate multi-page documents using jsPDF

---

## 🛠 Tech Stack

- **Frontend:** React 18, JavaScript, HTML5, CSS3
- **Build tool:** Vite
- **HTTP client:** Axios
- **Recipe data:** Spoonacular API
- **PDF generation:** jsPDF
- **Persistence:** Browser local storage
- **Deployment:** Vercel

---

## 📁 Project Architecture

```text
greenplate/
├── api/
│   └── spoonacular.js       # Serverless API proxy
├── public/                  # Public for images
│   ├── flg-signature.svg
│   └── logo.svg
├── src/
│   ├── __mocks__/           # Mock data for testing
│   ├── api/                 # API communication layer
│   ├── components/          # Reusable interface components plus tests
│   ├── context/             # APP context
│   ├── hooks/               # Custom React hooks
│   ├── pages/               # Application pages
│   ├── utils/               # Shared utilities and PDF functions
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Shared utilities and PDF functions
│   ├── styles/              # Global and component styles
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
- jsPDF for client-side PDF generation
- React and Vite for the frontend development environment
- Vercel for deployment and serverless functions
