# SongSense AI

> A smart weather-aware song recommendation system that recommends songs based on your mood, intent, and current weather conditions.

## Overview

**SongSense AI** is a web-based song recommendation application built with **Node.js, Express.js, JavaScript, and Natural Language Processing (NLP)**.

The application understands a user's message, identifies their intent or mood, checks the current weather conditions, and recommends a suitable song or playlist.

For example:

> "I feel happy and want something energetic."

SongSense AI analyzes the request and combines it with the current weather to provide a personalized music recommendation.

## Features

**Personalized Song Recommendations**
  - Recommends songs based on user input and detected intent.

  **Intent Classification**
  - Uses NLP techniques to understand the user's message and determine their mood or intent.

  **Weather-Based Recommendations**
  - Fetches weather information based on the user's location.
  - Weather conditions can influence the recommended music.

  **City Geocoding**
  - Converts a city name into geographical coordinates.

  **Playlist Generation**
  - Provides a primary song recommendation along with a playlist.

  **REST API**
  - Backend APIs handle geocoding and song recommendation requests.

  **Responsive Web Interface**
  - Simple frontend interface for interacting with the recommendation system.

---

## 🛠️ Tech Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Node.js
- Express.js

### NLP
- Natural

### APIs & Libraries
- Axios
- CORS
- Dotenv

### Development Tools
- Nodemon
- Git & GitHub

## Project Structure


SongSense-AI/
│
├── data/
│
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── services/
│   ├── intentClassifier.js
│   ├── songRecommender.js
│   └── weatherService.js
│
├── .env
├── .gitignore
├── package.json
├── package-lock.json
├── server.js
└── README.md
