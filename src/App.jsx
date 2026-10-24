
import { useState } from "react";
import StudentDashboard from "./StudentDashboard";
import OwnerDashboard from "./OwnerDashboard";

import "./App.css";

const API_URL = "http://localhost:8080/api/auth";

export default function App() {
  const [portal, setPortal] = useState("home");
  const [authPage, setAuthPage] = useState("login");

  const [users, setUsers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("messmateUsers")) || [];
    } catch {
      return [];
    }
  });

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    });
  };

  const goHome = () => {
    setPortal("home");
    setAuthPage("login");
    setMessage("");
    setLoading(false);
    resetForm();
  };

  const selectRole = (role) => {
    setPortal(role);
    setAuthPage("login");
    setMessage("");
    resetForm();
  };

  const updateField = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
    setMessage("");
  };

  // Save the student profile after successful backend login.
  const saveStudentSession = (student) => {
    localStorage.setItem(
      "messmateStudent",
      JSON.stringify({
        id: student.studentId ?? student.id,
        studentId: student.studentId ?? student.id,
        name: student.fullName || student.name,
        fullName: student.fullName || student.name,
        email: student.email,
        phone: student.phone || "",
        role: student.role || "STUDENT",
      })
    );

    setPortal("studentDashboard");
    setMessage("");
    resetForm();
  };

  // REGISTER
  const handleSignup = async (event) => {
    event.preventDefault();

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.password
    ) {
      setMessage("Please fill in all required fields.");
      return;
    }

    if (form.password.length < 6) {
      setMessage("Password must contain at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    const email = form.email.trim().toLowerCase();

    // Student registration goes to Spring Boot and MySQL.
    if (portal === "student") {
      setLoading(true);

      try {
        const response = await fetch(`${API_URL}/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName: form.name.trim(),
            email,
            phone: form.phone.trim(),
            password: form.password,
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message ||
              data.error ||
              "Registration failed. This email may already be registered."
          );
        }

        setMessage(
          data.message || "Registration successful! Please log in."
        );
        setAuthPage("login");
        resetForm();
      } catch (error) {
        setMessage(
          error.message ||
            "Cannot connect to the backend. Check that Spring Boot is running."
        );
      } finally {
        setLoading(false);
      }

      return;
    }

    // Mess Owner registration remains in localStorage.
    const existingUser = users.find(
      (user) => user.email === email && user.role === portal
    );

    if (existingUser) {
      setMessage("An account with this email already exists.");
      return;
    }

    const newUser = {
      name: form.name.trim(),
      email,
      phone: form.phone.trim(),
      password: form.password,
      role: portal,
    };

    const updatedUsers = [...users, newUser];

    try {
      localStorage.setItem("messmateUsers", JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
      setMessage("Account created successfully! Please log in.");
      setAuthPage("login");
      resetForm();
    } catch {
      setMessage("Could not save the account in browser storage.");
    }
  };

  // LOGIN
  const handleLogin = async (event) => {
    event.preventDefault();

    const email = form.email.trim().toLowerCase();

    if (!email || !form.password) {
      setMessage("Please enter your email and password.");
      return;
    }

    // Student login is verified by Spring Boot.
    if (portal === "student") {
      setLoading(true);

      try {
        const response = await fetch(`${API_URL}/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password: form.password,
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || data.error || "Invalid email or password."
          );
        }

        // The backend should return fullName, email and optionally phone/role.
        saveStudentSession({
          ...data,
          email: data.email || email,
        });
      } catch (error) {
        setMessage(
          error.message ||
            "Cannot connect to the backend. Check that Spring Boot is running."
        );
      } finally {
        setLoading(false);
      }

      return;
    }

    // Mess Owner login remains in localStorage.
    const matchedUser = users.find(
      (user) =>
        user.email === email &&
        user.password === form.password &&
        user.role === portal
    );

    if (!matchedUser) {
      setMessage("Invalid email or password for this portal.");
      return;
    }

    setMessage("");
    resetForm();
    setPortal("ownerDashboard");
  };

  // Existing dashboards
  if (portal === "studentDashboard") {
    return <StudentDashboard onHome={goHome} />;
  }

  if (portal === "ownerDashboard") {
    return <OwnerDashboard onHome={goHome} />;
  }

  // Login and signup pages
  if (portal === "student" || portal === "owner") {
    const isStudent = portal === "student";
    const isSignup = authPage === "signup";
    const roleName = isStudent ? "Student" : "Mess Owner";

    return (
      <div className="app-shell">
        <header className="topbar">
          <div
            className="brand"
            onClick={goHome}
            style={{ cursor: "pointer" }}
          >
            <span className="brand-icon">♨</span>
            <span>
              <strong>
                Mess<span>Mate</span>
              </strong>
              <small>Good food. Easy days.</small>
            </span>
          </div>

          <div className="topbar-right">
            <span className="status-dot" />
            <span>{roleName} Portal</span>
          </div>
        </header>

        <main className="main-content">
          <section className="section-card auth-card">
            <button
              type="button"
              className="back-button"
              onClick={goHome}
            >
              ← Back to role selection
            </button>

            <div className="auth-heading">
              <span className="hero-tag">
                {isStudent ? "STUDENT PORTAL" : "MESS OWNER PORTAL"}
              </span>

              <h2>
                {isSignup ? "Create your account" : "Welcome back!"}
              </h2>

              <p className="muted">
                {isSignup
                  ? `Sign up to get started with your ${roleName.toLowerCase()} portal.`
                  : `Log in to continue to your ${roleName.toLowerCase()} dashboard.`}
              </p>
            </div>

            <div className="auth-tabs">
              <button
                type="button"
                className={!isSignup ? "auth-tab active" : "auth-tab"}
                onClick={() => {
                  setAuthPage("login");
                  setMessage("");
                  resetForm();
                }}
              >
                Login
              </button>

              <button
                type="button"
                className={isSignup ? "auth-tab active" : "auth-tab"}
                onClick={() => {
                  setAuthPage("signup");
                  setMessage("");
                  resetForm();
                }}
              >
                Sign Up
              </button>
            </div>

            <form
              className="auth-form"
              onSubmit={isSignup ? handleSignup : handleLogin}
            >
              {isSignup && (
                <>
                  <label htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={updateField}
                    autoComplete="name"
                    required
                  />

                  <label htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={form.phone}
                    onChange={updateField}
                    autoComplete="tel"
                    required
                  />
                </>
              )}

              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={updateField}
                autoComplete="email"
                required
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={updateField}
                autoComplete={
                  isSignup ? "new-password" : "current-password"
                }
                required
              />

              {isSignup && (
                <>
                  <label htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    value={form.confirmPassword}
                    onChange={updateField}
                    autoComplete="new-password"
                    required
                  />
                </>
              )}

              {message && (
                <p
                  className={
                    message.toLowerCase().includes("success")
                      ? "auth-message success"
                      : "auth-message"
                  }
                  role="status"
                >
                  {message}
                </p>
              )}

              <button
                type="submit"
                className={isStudent ? "primary-button" : "green-button"}
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : `${isSignup ? "Create Account" : "Login"} →`}
              </button>
            </form>

            <p className="auth-switch">
              {isSignup
                ? "Already have an account?"
                : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setAuthPage(isSignup ? "login" : "signup");
                  setMessage("");
                  resetForm();
                }}
              >
                {isSignup ? "Login" : "Sign Up"}
              </button>
            </p>
          </section>

          <footer className="page-footer">
            Made with care for better everyday meals 💚
          </footer>
        </main>
      </div>
    );
  }

  // Landing page
  return (
    <div className="app-shell landing-page">
      <header className="topbar landing-topbar">
        <div className="brand landing-brand">
          <span className="brand-icon">♨</span>
          <span>
            <strong>
              Mess<span>Mate</span>
            </strong>
            <small>Good food. Easy days.</small>
          </span>
        </div>

        <div className="topbar-right landing-status">
          <span className="status-dot" />
          <span className="status-leaf">🌿</span>
          <span>Freshly cooked, every day</span>
        </div>
      </header>

      <main className="main-content landing-main">
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <span className="landing-eyebrow">
              <span className="eyebrow-line" />
              YOUR MESS, MADE SIMPLE
            </span>

            <h1>
              Good food,
              <br />
              <span>less to worry about.</span>
            </h1>

            <p>
              Choose your portal to check meals, track days
              <br className="desktop-break" />
              and manage your monthly bill.
            </p>
          </div>

          <div className="landing-food-visual">
            <div className="food-shape" />
            <img
              className="landing-food-image"
              src="https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=1100&q=85"
              alt="Indian thali with rice, roti and curry"
            />
            <span className="food-spark spark-one" />
            <span className="food-spark spark-two" />
            <span className="food-spark spark-three" />
          </div>
        </section>

        <section className="landing-portals">
          <div className="landing-section-heading">
            <h2>How would you like to continue?</h2>
            <span />
          </div>

          <div className="landing-card-grid">
            <article className="landing-portal-card student-card">
              <div className="portal-illustration student-illustration">
                <div className="illustration-circle">🎒</div>
                <span className="illustration-person">🧑🏻‍🎓</span>
                <span className="illustration-meal">🍱</span>
              </div>

              <div className="portal-card-content">
                <h3>I'm a student</h3>
                <p>
                  See today’s menu, mark your meals
                  <br className="desktop-break" />
                  and check your bill.
                </p>

                <button
                  className="landing-portal-button student-portal-button"
                  onClick={() => selectRole("student")}
                >
                  Open student portal <span>→</span>
                </button>
              </div>
            </article>

            <article className="landing-portal-card owner-card">
              <div className="portal-illustration owner-illustration">
                <div className="illustration-circle">🍃</div>
                <span className="illustration-person">👨🏻‍🍳</span>
                <span className="illustration-meal">📋</span>
              </div>

              <div className="portal-card-content">
                <h3>I manage a mess</h3>
                <p>
                  Plan the menu, manage meals
                  <br className="desktop-break" />
                  and track payments.
                </p>

                <button
                  className="landing-portal-button owner-portal-button"
                  onClick={() => selectRole("owner")}
                >
                  Open owner portal <span>→</span>
                </button>
              </div>
            </article>
          </div>
        </section>

        <footer className="page-footer">
          Made with care for better everyday meals 💚
        </footer>
      </main>
    </div>
  );
}
