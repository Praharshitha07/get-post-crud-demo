const express = require("express");
const session = require("express-session");
const { db, admin } = require("./firebase");

const app = express();

// Firebase initialized in ./firebase

// Express setup
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(session({
  secret: "expense-secret",
  resave: false,
  saveUninitialized: true
}));

// ----------- ROUTES -----------
//login page
// Login page
app.get("/login", (req, res) => {
  res.render("login"); // make sure you have login.ejs
});

// Login POST
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const snapshot = await db.collection("users")
      .where("email", "==", email)
      .where("password", "==", password)
      .get();

    if (snapshot.empty) {
      return res.send("Invalid Email or Password");
    }

    const user = snapshot.docs[0].data();
    req.session.user = user;  // store in session
    res.redirect("/");

  } catch (error) {
    console.log(error);
    res.send("Login Error");
  }
});
//signup page
// Signup page
app.get("/signup", (req, res) => {
  res.render("signup"); // make sure you have signup.ejs
});

// Signup POST
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    const snapshot = await db.collection("users").where("email", "==", email).get();
    if (!snapshot.empty) {
      return res.send("Email already exists");
    }

    await db.collection("users").add({ name, email, password });
    res.redirect("/login");
  } catch (error) {
    console.log(error);
    res.send("Signup Error");
  }
});

// Home page: display expenses
app.get("/", async (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  try {
    // Try ordered query first (may require a composite index in Firestore)
    let snapshot;
    try {
      snapshot = await db.collection("expenses")
        .where("userEmail", "==", req.session.user.email)
        .orderBy("createdAt", "desc")
        .get();
    } catch (err) {
      // If Firestore requires a composite index, fall back to fetching without ordering
      console.warn('Ordered query failed, falling back to unordered fetch:', err && err.message ? err.message : err);
      snapshot = await db.collection("expenses")
        .where("userEmail", "==", req.session.user.email)
        .get();
    }

    let expenses = [];
    snapshot.forEach(doc => {
      expenses.push({ id: doc.id, ...doc.data() });
    });

    // If result came unordered, sort in-memory by createdAt (newest first)
    expenses.sort((a, b) => {
      const ta = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const tb = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return tb - ta;
    });

    res.render("home", { user: req.session.user, expenses });

  } catch (error) {
    console.error("Error loading expenses:", error && error.stack ? error.stack : error);
    // Expose the error message in response temporarily for debugging
    res.send("Error loading expenses: " + (error && error.message ? error.message : String(error)));
  }
});

// Temporary: impersonate a test user for debugging
app.get('/__impersonate', (req, res) => {
  req.session.user = { name: 'Debug User', email: 'debug@example.com' };
  res.send('Impersonated as debug@example.com — now visit / to reproduce.');
});

// Health check for Firestore connectivity
app.get('/health', async (req, res) => {
  try {
    const snapshot = await db.collection('expenses').limit(1).get();
    return res.json({ ok: true, docs: snapshot.size });
  } catch (err) {
    console.error('Health check error', err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

// Add Expense GET
app.get("/add-expense", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.render("add-expense");
});

// Add Expense POST
app.post("/add-expense", async (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  const { date, category, note, amount } = req.body;

  console.log("POST DATA:", req.body); // debug

  // Validation
  if (!date || !category || !note || !amount || isNaN(Number(amount))) {
    return res.send("All fields are required and amount must be a number");
  }

  try {
    await db.collection("expenses").add({
      userEmail: req.session.user.email,
      note,
      category,
      amount: Number(amount),
      date,
      createdAt: admin.firestore.Timestamp.now()
    });

    res.redirect("/"); // go back to home

  } catch (error) {
    console.log("Firebase Error:", error);
    res.send("Error adding expense");
  }
});

// Delete Expense
app.get("/delete-expense/:id", async (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  const id = req.params.id;
  try {
    await db.collection("expenses").doc(id).delete();
    res.redirect("/");
  } catch (error) {
    console.log("Delete Error:", error);
    res.send("Error deleting expense");
  }
});
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

// Start server
app.listen(3000, () => console.log("Server running on http://localhost:3000"));


