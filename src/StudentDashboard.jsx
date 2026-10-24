import { useEffect, useMemo, useState } from "react";
import "./StudentDashboard.css";

const API_URL = "http://localhost:8080/api/menus";

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Browser storage may be unavailable.
  }
}

const defaultPaymentSettings = {
  upiId: "",
  qrImage: "",
  methods: ["upi", "cash", "bank"],
  bankDetails: "",
};

export default function StudentDashboard({ onHome }) {
  const today = todayKey();

  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState("");

  const [tab, setTab] = useState("attendance");

  const [student] = useState(() =>
    readStorage("messmateStudent", {})
  );

  const [meals, setMeals] = useState(() =>
    readStorage("messmate-meals", {})
  );

  const [vacation, setVacation] = useState(() =>
    readStorage("messmate-vacation", {
      enabled: false,
      start: "",
      end: "",
    })
  );

  const [feedback, setFeedback] = useState(() =>
    readStorage("messmate-feedback", [])
  );

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(new Date());

  const [billMonth, setBillMonth] = useState(
    today.slice(0, 7)
  );

  const [paymentSettings, setPaymentSettings] = useState(() =>
    readStorage(
      "messmatePaymentSettings",
      defaultPaymentSettings
    )
  );

  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [paymentNotice, setPaymentNotice] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [paymentRecords, setPaymentRecords] = useState(() =>
    readStorage("messmate-demo-payments", {})
  );

  const name =
    student?.name || student?.fullName || "Student";
  const email = student?.email || "";
  const phone = student?.phone || "";

  const studentKey = String(
    student?.studentId ?? student?.id ?? email ?? "student"
  );

  const paymentKey = `${studentKey}-${billMonth}`;
  const currentPayment = paymentRecords[paymentKey];
  const isPaid = currentPayment?.status === "Paid";

  const enabledMethods = Array.isArray(paymentSettings.methods)
    ? paymentSettings.methods
    : defaultPaymentSettings.methods;

  const methodLabels = {
    upi: "UPI / QR Code",
    cash: "Cash",
    bank: "Bank Transfer",
  };

  useEffect(() => {
    let cancelled = false;

    async function fetchTodayMenu() {
      try {
        setMenuLoading(true);
        setMenuError("");

        const response = await fetch(`${API_URL}/today`);

        if (!response.ok) {
          throw new Error(`Menu request failed (${response.status}).`);
        }

        const data = await response.json();

        if (!cancelled) {
          setMenuItems(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!cancelled) {
          setMenuError(
            error.message || "Could not connect to the menu server."
          );
        }
      } finally {
        if (!cancelled) setMenuLoading(false);
      }
    }

    fetchTodayMenu();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    saveStorage("messmate-meals", meals);
  }, [meals]);

  useEffect(() => {
    saveStorage("messmate-vacation", vacation);
  }, [vacation]);

  useEffect(() => {
    saveStorage("messmate-feedback", feedback);
  }, [feedback]);

  useEffect(() => {
    saveStorage("messmate-demo-payments", paymentRecords);
  }, [paymentRecords]);

  useEffect(() => {
    if (tab === "bills") {
      setPaymentSettings(
        readStorage(
          "messmatePaymentSettings",
          defaultPaymentSettings
        )
      );
      setPaymentNotice("");
    }
  }, [tab]);

  useEffect(() => {
    if (
      enabledMethods.length > 0 &&
      !enabledMethods.includes(paymentMethod)
    ) {
      setPaymentMethod(enabledMethods[0]);
    }
  }, [enabledMethods, paymentMethod]);

  const isVacation = (date) =>
    vacation.enabled &&
    vacation.start &&
    vacation.end &&
    date >= vacation.start &&
    date <= vacation.end;

  const todayMeals = meals[today] || {};

  function markMeal(session) {
    const hour = now.getHours();

    const allowed =
      session === "lunch"
        ? hour < 15
        : hour >= 15 && hour < 19;

    if (!allowed) {
      setNotice(
        session === "lunch"
          ? "Lunch window is open until 3 PM."
          : "Dinner window is open from 3 PM to 7 PM."
      );
      return;
    }

    if (isVacation(today)) {
      setNotice("Vacation mode is active today.");
      return;
    }

    if (todayMeals[session]) {
      setNotice(`Your ${session} is already marked.`);
      return;
    }

    const selectedItems = menuItems.filter(
      (item) =>
        item.mealType?.toLowerCase() === session &&
        item.available
    );

    if (selectedItems.length === 0) {
      setNotice(`No ${session} menu is available today.`);
      return;
    }

    setMeals((previous) => ({
      ...previous,
      [today]: {
        ...(previous[today] || {}),
        [session]: {
          items: selectedItems.map((item) => ({
            name: item.mealName,
            price: Number(item.price) || 0,
          })),
          quantity: 1,
          time: new Date().toISOString(),
        },
      },
    }));

    setNotice(
      `${session === "lunch" ? "Lunch" : "Dinner"} marked successfully!`
    );
  }

  const attendanceRows = useMemo(() => {
    const [year, month] = billMonth.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    return Array.from({ length: daysInMonth }, (_, index) => {
      const date =
        `${year}-${String(month).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`;

      const dayMeals = meals[date] || {};

      const entries = ["lunch", "dinner"].flatMap((session) => {
        if (!dayMeals[session]) return [];

        return (dayMeals[session].items || []).map((entry) => {
          if (typeof entry === "string") {
            return { item: entry, price: 0 };
          }

          return {
            item: entry.name || entry.mealName || "Meal",
            price: Number(entry.price) || 0,
          };
        });
      });

      return {
        date,
        entries,
        total: entries.reduce(
          (sum, entry) => sum + entry.price,
          0
        ),
      };
    });
  }, [meals, billMonth]);

  const grandTotal = attendanceRows.reduce(
    (sum, row) => sum + row.total,
    0
  );

  const markedDays = attendanceRows.filter(
    (row) => row.entries.length > 0
  ).length;

  const currency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);

  function submitVacation(event) {
    event.preventDefault();

    if (!vacation.start || !vacation.end) {
      setNotice("Please select both vacation dates.");
      return;
    }

    if (vacation.start < today) {
      setNotice("Vacation start date cannot be in the past.");
      return;
    }

    if (vacation.end < vacation.start) {
      setNotice("End date cannot be before start date.");
      return;
    }

    setVacation((previous) => ({
      ...previous,
      enabled: true,
    }));

    setNotice("Vacation mode activated.");
  }

  function submitFeedback(event) {
    event.preventDefault();

    if (rating < 1) {
      setNotice("Please select a star rating.");
      return;
    }

    if (comment.trim().length < 10) {
      setNotice("Please write at least 10 characters.");
      return;
    }

    setFeedback((previous) => [
      {
        rating,
        comment: comment.trim(),
        date: today,
      },
      ...previous,
    ]);

    setRating(0);
    setComment("");
    setNotice("Thank you! Your feedback has been saved.");
  }

  function downloadBill() {
    const lines = [
      "MessMate - Monthly Bill",
      `Student: ${name}`,
      `Month: ${billMonth}`,
      `Days with meals: ${markedDays}`,
      "",
      ...attendanceRows
        .filter((row) => row.entries.length > 0)
        .map(
          (row) =>
            `${row.date}, ${row.entries.map((entry) => entry.item).join("; ")}, ${row.total}`
        ),
      "",
      `Total: Rs. ${grandTotal}`,
      `Payment status: ${isPaid ? "Paid (Demo)" : "Pending"}`,
      "",
      "Demo invoice only.",
    ];

    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `messmate-bill-${billMonth}.txt`;
    link.click();

    URL.revokeObjectURL(url);
    setNotice("Your demo bill has been downloaded.");
  }

  // Fake payment only. No payment gateway or real transaction.
  async function submitFakePayment() {
    if (isPaid) {
      setPaymentNotice("This month's demo bill is already Paid.");
      return;
    }

    if (grandTotal <= 0) {
      setPaymentNotice(
        "There are no recorded meal charges for this month."
      );
      return;
    }

    setPaymentLoading(true);
    setPaymentNotice("Processing demo payment...");

    try {
      await new Promise((resolve) => setTimeout(resolve, 700));

      const record = {
        status: "Paid",
        method: paymentMethod,
        amount: grandTotal,
        billingMonth: billMonth,
        studentName: name,
        date: new Date().toISOString(),
        demo: true,
      };

      setPaymentRecords((previous) => ({
        ...previous,
        [paymentKey]: record,
      }));

      setPaymentNotice(
        "Demo payment successful! No real money was charged."
      );
    } catch {
      setPaymentNotice("Demo payment failed. Please try again.");
    } finally {
      setPaymentLoading(false);
    }
  }

  const tabs = [
    { id: "attendance", icon: "🍱", label: "Menu & meals" },
    { id: "vacation", icon: "🌴", label: "Vacation" },
    { id: "bills", icon: "🧾", label: "My bills" },
    { id: "feedback", icon: "💚", label: "Feedback" },
  ];

  return (
    <div className="mm-app">
      <header className="mm-topbar">
        <button
          className="mm-brand"
          onClick={onHome}
          aria-label="Back to home"
        >
          <span className="mm-logo">♨</span>
          <span>
            <strong>
              Mess<span>Mate</span>
            </strong>
            <small>Good food. Easy days.</small>
          </span>
        </button>

        <div className="mm-user">
          <span className="mm-avatar">
            {name.charAt(0).toUpperCase()}
          </span>
          <span>
            <strong>{name}</strong>
            <small>Student space</small>
          </span>
          <button className="mm-outline" onClick={onHome}>
            Home
          </button>
        </div>
      </header>

      <main className="mm-main">
        <section className="mm-welcome">
          <div>
            <p className="mm-eyebrow">YOUR MESS, MADE SIMPLE</p>
            <h1>
              Hello, {name.split(" ")[0]}! <span>👋</span>
            </h1>
            <p>
              Good food, fewer worries. Here's your meal plan at a glance.
            </p>
          </div>

          <div className="mm-welcome-art" aria-hidden="true">
            🍛
          </div>

          <div className="mm-date-pill">
            <span>●</span>{" "}
            {now.toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          </div>
        </section>

        <section className="mm-stats">
          <article className="mm-stat">
            <span className="mm-stat-icon orange">🍽️</span>
            <div>
              <small>Meals marked today</small>
              <strong>
                {Number(Boolean(todayMeals.lunch)) +
                  Number(Boolean(todayMeals.dinner))}{" "}
                / 2
              </strong>
            </div>
          </article>

          <article className="mm-stat">
            <span className="mm-stat-icon green">📅</span>
            <div>
              <small>Days with meals</small>
              <strong>{markedDays}</strong>
            </div>
          </article>

          <article className="mm-stat">
            <span className="mm-stat-icon orange">₹</span>
            <div>
              <small>Recorded meal total</small>
              <strong>{currency(grandTotal)}</strong>
            </div>
          </article>
        </section>

        <nav className="mm-tabs" aria-label="Student dashboard sections">
          {tabs.map((item) => (
            <button
              key={item.id}
              className={tab === item.id ? "mm-tab active" : "mm-tab"}
              onClick={() => {
                setTab(item.id);
                setNotice("");
                setPaymentNotice("");
              }}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>

        {notice && (
          <div className="mm-notice" role="status">
            <span>{notice}</span>
            <button
              onClick={() => setNotice("")}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {tab === "attendance" && (
          <section className="mm-section">
            <div className="mm-section-heading">
              <div>
                <p className="mm-eyebrow">FRESH FROM THE KITCHEN</p>
                <h2>Today's menu</h2>
              </div>
              <span className="mm-live">
                <i />
                {menuLoading
                  ? "Loading menu"
                  : menuError
                    ? "Menu unavailable"
                    : "Live menu"}
              </span>
            </div>

            {menuLoading && (
              <p className="mm-notice">Loading today's menu...</p>
            )}

            {menuError && (
              <p className="mm-notice" role="alert">
                {menuError}. Check whether the backend is running on port 8080.
              </p>
            )}

            <div className="mm-meal-grid">
              {[
                {
                  id: "lunch",
                  title: "Lunch",
                  time: "Until 3:00 PM",
                  emoji: "☀️",
                },
                {
                  id: "dinner",
                  title: "Dinner",
                  time: "3:00 PM – 7:00 PM",
                  emoji: "🌙",
                },
              ].map((meal) => {
                const items = menuItems.filter(
                  (item) =>
                    item.mealType?.toLowerCase() === meal.id &&
                    item.available
                );

                const marked = Boolean(todayMeals[meal.id]);

                return (
                  <article className="mm-meal-card" key={meal.id}>
                    <div className="mm-meal-top">
                      <span className="mm-meal-emoji">{meal.emoji}</span>
                      <div>
                        <h3>{meal.title}</h3>
                        <small>{meal.time}</small>
                      </div>
                      <span className={marked ? "mm-status done" : "mm-status"}>
                        {marked ? "Marked ✓" : "Not marked"}
                      </span>
                    </div>

                    <div className="mm-menu-items">
                      {items.map((item) => (
                        <div className="mm-menu-item" key={item.id}>
                          <span>
                            <i /> {item.mealName}
                          </span>
                          <strong>{currency(Number(item.price) || 0)}</strong>
                        </div>
                      ))}

                      {!menuLoading && items.length === 0 && (
                        <p className="mm-muted">
                          No items added for {meal.title.toLowerCase()} today.
                        </p>
                      )}
                    </div>

                    <button
                      className={marked ? "mm-primary mm-disabled" : "mm-primary"}
                      disabled={
                        menuLoading ||
                        Boolean(menuError) ||
                        items.length === 0 ||
                        marked
                      }
                      onClick={() => markMeal(meal.id)}
                    >
                      {marked
                        ? "Meal marked ✓"
                        : `I'm taking ${meal.title.toLowerCase()} →`}
                    </button>
                  </article>
                );
              })}
            </div>

            <div className="mm-section-heading mm-table-heading">
              <div>
                <p className="mm-eyebrow">YOUR MONTH AT A GLANCE</p>
                <h2>Meal history</h2>
              </div>

              <input
                aria-label="Choose bill month"
                type="month"
                value={billMonth}
                onChange={(event) => {
                  setBillMonth(event.target.value);
                  setPaymentNotice("");
                }}
              />
            </div>

            <div className="mm-calendar">
              <div className="mm-calendar-legend">
                <span><i className="present" /> Meal recorded</span>
                <span><i className="vacant" /> Vacation</span>
                <span><i className="upcoming" /> No meal recorded</span>
              </div>

              <div className="mm-calendar-grid">
                {attendanceRows.map((row) => (
                  <div
                    key={row.date}
                    title={`${row.date}: ${
                      row.entries.length
                        ? "Meal recorded"
                        : isVacation(row.date)
                          ? "Vacation"
                          : "No meal recorded"
                    }`}
                    className={`mm-calendar-day ${
                      row.entries.length
                        ? "present"
                        : isVacation(row.date)
                          ? "vacant"
                          : "upcoming"
                    }`}
                  >
                    {Number(row.date.slice(-2))}
                  </div>
                ))}
              </div>
            </div>

            <div className="mm-table-wrap">
              <table className="mm-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Day</th>
                    <th>Food items</th>
                    <th>Qty.</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRows
                    .filter((row) => row.entries.length > 0)
                    .map((row, index) => (
                      <tr key={row.date}>
                        <td>{index + 1}</td>
                        <td>{row.date.slice(-2)}</td>
                        <td>
                          {new Date(`${row.date}T12:00:00`).toLocaleDateString(
                            "en-IN",
                            { weekday: "short" }
                          )}
                        </td>
                        <td>{row.entries.map((entry) => entry.item).join(", ")}</td>
                        <td>{row.entries.length}</td>
                        <td>{currency(row.total)}</td>
                        <td>{currency(row.total)}</td>
                      </tr>
                    ))}

                  {attendanceRows.every((row) => !row.entries.length) && (
                    <tr>
                      <td colSpan="7" className="mm-empty">
                        Your meal history will appear here when you mark a meal.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="6">Grand total · {billMonth}</td>
                    <td>{currency(grandTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        )}

        {tab === "vacation" && (
          <section className="mm-section">
            <p className="mm-eyebrow">TAKE A LITTLE BREAK</p>
            <h2>Vacation mode 🌴</h2>
            <p className="mm-description">
              Set your vacation dates to keep your mess records organised.
            </p>

            <form className="mm-form-card" onSubmit={submitVacation}>
              <label>
                Vacation starts on
                <input
                  type="date"
                  min={today}
                  value={vacation.start}
                  onChange={(event) =>
                    setVacation({ ...vacation, start: event.target.value })
                  }
                  required
                />
              </label>

              <label>
                Vacation ends on
                <input
                  type="date"
                  min={vacation.start || today}
                  value={vacation.end}
                  onChange={(event) =>
                    setVacation({ ...vacation, end: event.target.value })
                  }
                  required
                />
              </label>

              <button className="mm-primary" type="submit">
                Activate vacation →
              </button>

              {vacation.enabled && (
                <>
                  <button
                    className="mm-secondary"
                    type="button"
                    onClick={() => {
                      setVacation({ ...vacation, enabled: false });
                      setNotice("Vacation mode is now off.");
                    }}
                  >
                    Turn vacation mode off
                  </button>

                  <p className="mm-success">
                    ✓ Vacation active: {vacation.start} to {vacation.end}
                  </p>
                </>
              )}

              <small>
                Demo only: vacation status is saved in this browser.
              </small>
            </form>
          </section>
        )}

        {tab === "bills" && (
          <section className="mm-section">
            <p className="mm-eyebrow">NO BILLING SURPRISES</p>
            <h2>Your monthly bill</h2>

            <div className="mm-section-heading">
              <label htmlFor="bill-month">Select billing month</label>
              <input
                id="bill-month"
                type="month"
                value={billMonth}
                onChange={(event) => {
                  setBillMonth(event.target.value);
                  setPaymentNotice("");
                }}
              />
            </div>

            <div className="mm-profile">
              <div className="mm-avatar large">
                {name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3>{name}</h3>
                <p>{email || "Email not provided"}</p>
                <p>{phone || "Phone not provided"}</p>
              </div>
              <span className="mm-live">Student</span>
            </div>

            <div className="mm-bill-total">
              <small>Recorded meal charges · {billMonth}</small>
              <strong>{currency(grandTotal)}</strong>
              <p>Based on meals marked in this browser demo.</p>
            </div>

            <div className="mm-bill-lines">
              <div>
                <span>Days with recorded meals</span>
                <strong>{markedDays}</strong>
              </div>
              <div>
                <span>Recorded meal charges</span>
                <strong>{currency(grandTotal)}</strong>
              </div>
              <div>
                <span>Vacation credits</span>
                <strong>Calculated by owner</strong>
              </div>
              <div className="mm-bill-final">
                <span>Estimated recorded total</span>
                <strong>{currency(grandTotal)}</strong>
              </div>
            </div>

            <div className="mm-payment-note">
              <span>💳</span>
              <div>
                <strong>Fake Payment Demo</strong>
                <p>
                  Test the payment flow without transferring real money.
                </p>
              </div>
            </div>

            <div className="mm-form-card">
              <label htmlFor="payment-method">Choose demo payment method</label>

              <select
                id="payment-method"
                className="payment-select"
                value={paymentMethod}
                onChange={(event) => {
                  setPaymentMethod(event.target.value);
                  setPaymentNotice("");
                }}
              >
                <option value="upi">Fake UPI</option>
                <option value="card">Fake Card</option>
                <option value="cash">Demo Cash</option>
              </select>

              <div className="mm-payment-details">
                <h3>Demo payment summary</h3>
                <p>Student: {name}</p>
                <p>Billing month: {billMonth}</p>
                <p>Amount: {currency(grandTotal)}</p>
                <p>Method: {paymentMethod}</p>
                <p>
                  Status:{" "}
                  <strong className={isPaid ? "mm-success" : ""}>
                    {isPaid ? "Paid (Demo) ✓" : "Pending"}
                  </strong>
                </p>

                {isPaid && currentPayment?.date && (
                  <p>
                    Demo payment date:{" "}
                    {new Date(currentPayment.date).toLocaleString("en-IN")}
                  </p>
                )}
              </div>

              <button
                type="button"
                className="mm-primary"
                disabled={paymentLoading || isPaid || grandTotal <= 0}
                onClick={submitFakePayment}
              >
                {paymentLoading
                  ? "Processing demo..."
                  : isPaid
                    ? "Payment completed ✓"
                    : `Pay ${currency(grandTotal)} (Demo)`}
              </button>

              {paymentNotice && (
                <p className="mm-notice" role="status">
                  {paymentNotice}
                </p>
              )}

              <p className="mm-muted">
                Demo only. No real payment gateway is connected. No money
                is charged. The demo payment status is stored in this browser,
                not in the MySQL database.
              </p>
            </div>

            <button
              className="mm-primary mm-download"
              onClick={downloadBill}
            >
              Download bill summary ↓
            </button>

            <p className="mm-muted">
              Downloads a text summary, not an official PDF invoice.
            </p>
          </section>
        )}

        {tab === "feedback" && (
          <section className="mm-section">
            <p className="mm-eyebrow">HELP US SERVE YOU BETTER</p>
            <h2>How was your food? 💚</h2>
            <p className="mm-description">
              Your feedback helps us improve every meal.
            </p>

            <form className="mm-form-card" onSubmit={submitFeedback}>
              <label>Rate your experience</label>

              <div
                className="mm-stars"
                role="group"
                aria-label="Choose a rating"
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    aria-label={`${star} stars`}
                    aria-pressed={rating === star}
                    className={rating >= star ? "selected" : ""}
                    onClick={() => setRating(star)}
                  >
                    ★
                  </button>
                ))}
              </div>

              <label>
                Your comments
                <textarea
                  rows="5"
                  minLength="10"
                  maxLength="500"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Tell us what you enjoyed or what we could improve..."
                  required
                />
              </label>

              <div className="mm-character-count">
                {comment.length}/500 characters · At least 10 needed
              </div>

              <button className="mm-primary" type="submit">
                Send feedback →
              </button>
            </form>

            {feedback.length > 0 && (
              <div className="mm-feedback-history">
                <h3>Your submitted feedback</h3>
                {feedback.map((item, index) => (
                  <article key={`${item.date}-${index}`}>
                    <span className="mm-feedback-stars">
                      {"★".repeat(item.rating)}
                      {"☆".repeat(5 - item.rating)}
                    </span>
                    <p>{item.comment}</p>
                    <small>{item.date}</small>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        <footer className="mm-footer">
          Made with ♡ for happier mealtimes · MessMate
        </footer>
      </main>
    </div>
  );
}