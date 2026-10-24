
import { useState } from "react";
import "./App.css";

const meals = [
  { name: "Chapati Bhaji", price: 40, emoji: "🫓" },
  { name: "Dal Rice", price: 50, emoji: "🍛" },
  { name: "Veg Thali", price: 80, emoji: "🥗" },
  { name: "Special Sweet", price: 30, emoji: "🍮" },
];

export default function App() {
  const [tab, setTab] = useState("Overview");
  const [student, setStudent] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("messmateStudent")) || {
        name: "Student",
        email: "",
        phone: "",
      };
    } catch {
      return { name: "Student", email: "", phone: "" };
    }
  });

  const [mealLog, setMealLog] = useState([]);
  const [vacation, setVacation] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [notice, setNotice] = useState("");

  const today = new Date();
  const date = today.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  function markMeal(meal) {
    const hour = today.getHours();
    const allowed =
      meal === "Lunch"
        ? hour >= 0 && hour < 15
        : hour >= 15 && hour < 19;

    if (!allowed) {
      setNotice(
        meal === "Lunch"
          ? "Lunch window is open from 12 AM to 3 PM."
          : "Dinner window is open from 3 PM to 7 PM."
      );
      return;
    }

    if (vacation) {
      setNotice("Your vacation mode is on. Turn it off to mark a meal.");
      return;
    }

    if (mealLog.some((entry) => entry.date === date && entry.meal === meal)) {
      setNotice(`${meal} has already been marked for today.`);
      return;
    }

    setMealLog((previous) => [...previous, { date, meal }]);
    setNotice(`${meal} marked successfully. Enjoy your meal!`);
  }

  function submitFeedback(event) {
    event.preventDefault();
    if (rating < 1) {
      setNotice("Please select a star rating.");
      return;
    }
    if (feedback.trim().length < 10) {
      setNotice("Please write at least 10 characters.");
      return;
    }
    setNotice("Thank you! Your feedback has been recorded in this demo.");
    setFeedback("");
    setRating(0);
  }

  function goHome() {
    localStorage.removeItem("messmateStudent");
    window.location.reload();
  }

  const tabs = [
    { name: "Overview", icon: "🏠" },
    { name: "Attendance & Menu", icon: "🍱" },
    { name: "Vacation Mode", icon: "🌴" },
    { name: "My Bills", icon: "🧾" },
    { name: "Feedback", icon: "💚" },
  ];

  const total = mealLog.length * 50;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={(e) => {
          e.preventDefault();
          setTab("Overview");
        }}>
          <span className="brand-icon">♨</span>
          <span>
            <strong>Mess<span>Mate</span></strong>
            <small>Good food. Easy days.</small>
          </span>
        </a>

        <div className="topbar-right">
          <span className="status-dot" />
          <span>Freshly cooked, every day</span>
          <button className="avatar" onClick={() => setNotice(`Hello, ${student.name}!`)}>
            {student.name.charAt(0).toUpperCase()}
          </button>
        </div>
      </header>

      <div className="dashboard-layout">
        <aside className="sidebar">
          <p className="sidebar-label">YOUR SPACE</p>
          {tabs.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${tab === item.name ? "active" : ""}`}
              onClick={() => {
                setTab(item.name);
                setNotice("");
              }}
            >
              <span>{item.icon}</span>
              {item.name}
              {tab === item.name && <span className="nav-arrow">›</span>}
            </button>
          ))}

          <div className="sidebar-help">
            <span>💬</span>
            <strong>Need a hand?</strong>
            <p>Your mess, made simple.</p>
          </div>

          <button className="logout-button" onClick={goHome}>
            ← Back to home
          </button>
        </aside>

        <main className="main-content">
          <div className="welcome-row">
            <div>
              <p className="eyebrow">YOUR STUDENT SPACE</p>
              <h1>
                {tab === "Overview"
                  ? `Hello, ${student.name}! 👋`
                  : tab}
              </h1>
              <p className="muted">
                {tab === "Overview"
                  ? "Ready for something delicious today?"
                  : "Everything you need, all in one happy place."}
              </p>
            </div>
            <div className="date-pill">📅 {date}</div>
          </div>

          {notice && (
            <div className="notice" role="status">
              <span>{notice}</span>
              <button onClick={() => setNotice("")}>×</button>
            </div>
          )}

          {tab === "Overview" && (
            <>
              <section className="hero-card">
                <div>
                  <span className="hero-tag">TODAY'S SPECIAL ✨</span>
                  <h2>Good food,<br />better days.</h2>
                  <p>Your meals, daily records and monthly bill — all in one place.</p>
                  <button className="primary-button" onClick={() => setTab("Attendance & Menu")}>
                    Explore today's menu <span>→</span>
                  </button>
                </div>
                <div className="hero-food" aria-label="Indian meal illustration">
                  <div className="food-glow" />
                  <span>🍛</span>
                  <span>🫓</span>
                  <span>🥗</span>
                </div>
              </section>

              <section className="stats-grid">
                <article className="stat-card">
                  <span className="stat-icon orange">🍽️</span>
                  <p>Meals marked</p>
                  <h2>{mealLog.length}</h2>
                  <small>Your recorded meals</small>
                </article>
                <article className="stat-card">
                  <span className="stat-icon green">📅</span>
                  <p>Days on vacation</p>
                  <h2>{vacation ? "Active" : "0"}</h2>
                  <small>{vacation ? "Billing pause selected" : "No active vacation"}</small>
                </article>
                <article className="stat-card">
                  <span className="stat-icon purple">🧾</span>
                  <p>Estimated meal total</p>
                  <h2>₹{total}</h2>
                  <small>Demo estimate only</small>
                </article>
              </section>

              <section className="section-card">
                <div className="section-heading">
                  <div>
                    <h2>Today's menu 🍴</h2>
                    <p>Fresh from your mess kitchen</p>
                  </div>
                  <button className="text-button" onClick={() => setTab("Attendance & Menu")}>
                    View all →
                  </button>
                </div>
                <div className="food-grid">
                  {meals.map((meal) => (
                    <article className="food-card" key={meal.name}>
                      <div className="food-emoji">{meal.emoji}</div>
                      <h3>{meal.name}</h3>
                      <p>Freshly prepared</p>
                      <strong>₹{meal.price}</strong>
                    </article>
                  ))}
                </div>
              </section>
            </>
          )}

          {tab === "Attendance & Menu" && (
            <>
              <section className="section-card">
                <div className="section-heading">
                  <div>
                    <h2>Mark your meals 🍽️</h2>
                    <p>Choose your meal during its available time.</p>
                  </div>
                </div>
                <div className="meal-actions">
                  <article className="meal-panel lunch">
                    <span>☀️</span>
                    <h3>Lunch time</h3>
                    <p>Available from 12 AM to 3 PM</p>
                    <button className="primary-button" onClick={() => markMeal("Lunch")}>
                      Taking lunch →
                    </button>
                  </article>
                  <article className="meal-panel dinner">
                    <span>🌙</span>
                    <h3>Dinner time</h3>
                    <p>Available from 3 PM to 7 PM</p>
                    <button className="green-button" onClick={() => markMeal("Dinner")}>
                      Taking dinner →
                    </button>
                  </article>
                </div>
              </section>

              <section className="section-card">
                <div className="section-heading">
                  <div>
                    <h2>What's cooking?</h2>
                    <p>Meal prices in your mess</p>
                  </div>
                </div>
                <div className="menu-list">
                  {meals.map((meal) => (
                    <div className="menu-row" key={meal.name}>
                      <span className="food-emoji small-emoji">{meal.emoji}</span>
                      <strong>{meal.name}</strong>
                      <span className="menu-price">₹{meal.price}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="section-card">
                <h2>Your meal history</h2>
                {mealLog.length === 0 ? (
                  <p className="empty-state">🥣 No meals marked yet. Your records will appear here.</p>
                ) : (
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr><th>Date</th><th>Meal</th><th>Status</th><th>Price</th></tr>
                      </thead>
                      <tbody>
                        {mealLog.map((entry, index) => (
                          <tr key={`${entry.date}-${entry.meal}-${index}`}>
                            <td>{entry.date}</td>
                            <td>{entry.meal}</td>
                            <td><span className="present-badge">Present</span></td>
                            <td>₹50</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {tab === "Vacation Mode" && (
            <section className="section-card vacation-card">
              <div className="vacation-art">🌴</div>
              <p className="eyebrow">TAKE A LITTLE BREAK</p>
              <h2>Your break, made easy.</h2>
              <p className="muted">Select vacation mode when you're away. In this frontend demo, this switch changes the display only; it does not pause real billing.</p>
              <label className="field-label" htmlFor="startDate">Start date</label>
              <input id="startDate" type="date" min={today.toISOString().slice(0, 10)} />
              <label className="field-label" htmlFor="endDate">End date</label>
              <input id="endDate" type="date" min={today.toISOString().slice(0, 10)} />
              <div className="toggle-row">
                <div><strong>Vacation mode</strong><p>Pause meal marking while you're away</p></div>
                <button
                  className={`toggle ${vacation ? "on" : ""}`}
                  role="switch"
                  aria-checked={vacation}
                  onClick={() => setVacation(!vacation)}
                ><span /></button>
              </div>
              <p className="muted">{vacation ? "Vacation mode is on." : "Vacation mode is currently off."}</p>
            </section>
          )}

          {tab === "My Bills" && (
            <>
              <section className="bill-summary">
                <p className="eyebrow">YOUR MONTHLY SUMMARY</p>
                <h2>Keep your bills simple.</h2>
                <p>Student: {student.name}</p>
                <p>{student.email || "Email not provided"}</p>
                <div className="bill-total">
                  <span>Estimated total</span>
                  <strong>₹{total}</strong>
                </div>
              </section>
              <section className="section-card">
                <h2>Bill breakdown</h2>
                <div className="menu-row"><span>Meals marked</span><strong>{mealLog.length}</strong></div>
                <div className="menu-row"><span>Vacation mode</span><strong>{vacation ? "On" : "Off"}</strong></div>
                <div className="menu-row"><span>Estimated meal total</span><strong>₹{total}</strong></div>
                <p className="muted">This is sample data, not an official bill or payment request.</p>
                <button className="primary-button" onClick={() => window.print()}>
                  Print / Save bill as PDF ↓
                </button>
              </section>
              <section className="section-card">
                <h2>Payment information</h2>
                <p>Ask your mess owner for the official UPI ID or QR code before making a payment.</p>
              </section>
            </>
          )}

          {tab === "Feedback" && (
            <section className="section-card feedback-card">
              <div className="feedback-art">💚</div>
              <p className="eyebrow">YOUR VOICE MATTERS</p>
              <h2>How was your meal?</h2>
              <p className="muted">Tell us how we can make your experience even better.</p>
              <form onSubmit={submitFeedback}>
                <label className="field-label">Your rating</label>
                <div className="stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      className={rating >= star ? "star selected" : "star"}
                      onClick={() => setRating(star)}
                      aria-label={`Rate ${star} out of 5`}
                    >★</button>
                  ))}
                </div>
                <label className="field-label" htmlFor="feedback">Your comments</label>
                <textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  minLength={10}
                  maxLength={500}
                  placeholder="The food was delicious because..."
                  rows={5}
                  required
                />
                <small>{feedback.length}/500 characters (minimum 10)</small>
                <button className="primary-button submit-feedback" type="submit">Send feedback →</button>
              </form>
            </section>
          )}

          <footer className="page-footer">
            Made with ❤️ for happier mealtimes · MessMate
          </footer>
        </main>
      </div>
    </div>
  );
}
