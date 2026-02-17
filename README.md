Expense Tracker (Firebase + Node.js + EJS)

A simple web application to store and manage daily expenses using Firebase Firestore.
This project mainly demonstrates Firebase integration, GET & POST requests, EJS rendering, and basic CRUD operations.

Features

Add daily expenses

Store data in Firebase Firestore

GET request to retrieve data

POST request to store data

Dynamic page rendering using EJS

Basic form validation

Session-based user handling

Technologies Used

Node.js

Express.js

Firebase Firestore

EJS Template Engine

HTML & CSS

Project Structure
expense-tracker/
│
├── app.js
├── firebase.js
├── package.json
│
├── views/
│   ├── login.ejs
│   ├── signup.ejs
│   ├── home.ejs
│   ├── expenses.ejs
│   └── add-expense.ejs
│
├── public/
│   └── styles.css
│
└── serviceAccountKey.json (not uploaded for security)

How It Works
GET Request

When the user opens the Home page, the server fetches expense data from Firebase Firestore and sends it to the EJS template using res.render().

POST Request

When the user submits the expense form, the server validates the data and stores it in Firebase using:

db.collection("expenses").add()


Each record contains:

userEmail

category

note

amount

date

createdAt

CRUD Operations

Create → Add new expense (Implemented)

Read → Fetch expenses from Firebase (Implemented)

Update → Can be added in future

Delete → Can be added in future

Firebase Setup

Create Firebase project

Enable Firestore Database

Download serviceAccountKey.json

Add Firebase Admin SDK in project

Connect using firebase.js
