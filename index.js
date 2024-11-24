const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "a2f5c3b8e15d6f7a8c9d1f0e8b2d3a4b",
    resave: false,
    saveUninitialized: true,
  })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const USERS = [
  {
    id: 1,
    username: "AdminUser",
    email: "admin@example.com",
    password: bcrypt.hashSync("admin123", SALT_ROUNDS), //In a database, you'd just store the hashes, but for
    // our purposes we'll hash these existing users when the
    // app loads
    role: "admin",
  },
  {
    id: 2,
    username: "RegularUser",
    email: "user@example.com",
    password: bcrypt.hashSync("user123", SALT_ROUNDS),
    role: "user", // Regular user
  },
];

// GET /login - Render login form
app.get("/login", (request, response) => {
  response.render("login");
});

// POST /login - Allows a user to login
app.post("/login", async (request, response) => {
  const { username, email, password } = request.body;
  const user = USERS.find(
    (user) => user.username === username && user.email === email
  );
  if (user && (await bcrypt.compare(password, user.password))) {
    request.session.user = user;
    return response.redirect("/landing");
  }

  if (!user) {
    return response.render("login", {
      error: "Invalid credentials",
    });
  }
});

// POST /logout - Logs a user out
app.post("/logout", (request, response) => {
  request.session.destroy(() => {
    response.redirect("/");
  });
});

// GET /signup - Render signup form
app.get("/signup", (request, response) => {
  const { email, username, password } = request.query;
  return response.render("signup", {
    email: email ?? "",
    username: username ?? "",
  });
});

// POST /signup - Allows a user to signup
app.post("/signup", (request, response) => {
  const { username, email, password } = request.body;

  const existingUser = USERS.find(
    (existingUser) => existingUser.email === email
  );
  if (existingUser) {
    return response.render("error", {
      error: "Email already associated with an account",
    });
  }

  const newUser = {
    id: USERS.length + 1,
    username,
    email,
    password: bcrypt.hashSync(password, SALT_ROUNDS),
    role: "user",
  };

  USERS.push(newUser);

  request.session.user = newUser;
  return response.redirect("/landing");
});

// GET / - Render index page or redirect to landing if logged in
app.get("/", (request, response) => {
  if (request.session.user) {
    return response.redirect("/landing");
  }
  response.render("index");
});

// GET /landing - Shows a welcome page for users, shows the names of all users if an admin
app.get("/landing", (request, response) => {
  if (!request.session.user) {
    return response.redirect("/login");
  }
  response.render("landing", {
    user: request.session.user,
  });
  const user = USERS.find((user) => user.username === username);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
