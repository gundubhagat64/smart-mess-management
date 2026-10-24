import { useEffect, useState } from "react";

const API_URL = "http://localhost:8080/api";

const demoStudents = [
  { id: "S001", name: "Aarav", room: "A-101" },
  { id: "S002", name: "Ananya", room: "B-204" },
  { id: "S003", name: "Ishaan", room: "A-108" },
  { id: "S004", name: "Meera", room: "C-302" },
];

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

const getToday = () => {
  const date = new Date();

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export default function OwnerDashboard({ onHome }) {
  const [activeTab, setActiveTab] = useState("Overview");

  const [lunchEnabled, setLunchEnabled] = useState(true);
  const [dinnerEnabled, setDinnerEnabled] = useState(true);

  const [menu, setMenu] = useState(() =>
    readStorage("messmateMenu", {
      lunch: "Veg Thali - 80",
      dinner: "Paneer Thali - 100",
    })
  );

  const [lunchInput, setLunchInput] = useState(menu.lunch);
  const [dinnerInput, setDinnerInput] = useState(menu.dinner);

  const [saved, setSaved] = useState(false);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuMessage, setMenuMessage] = useState("");

  const [paymentSettings, setPaymentSettings] = useState(() =>
    readStorage("messmatePaymentSettings", {
      upiId: "",
      qrImage: "",
      methods: ["upi", "cash", "bank"],
      bankDetails: "",
    })
  );

  const [students, setStudents] = useState(() =>
    readStorage(
      "messmatePaymentRecords",
      demoStudents.map((student, index) => ({
        ...student,
        status: index < 3 ? "Paid" : "Pending",
        method: index < 3 ? "Cash" : "",
      }))
    )
  );

  const [paymentMessage, setPaymentMessage] = useState("");
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [feedbackRecords, setFeedbackRecords] = useState([]);
  const [recordsMessage, setRecordsMessage] = useState("");

  const tabs = [
    "Overview",
    "Kitchen Control",
    "Publish Menu",
    "Student List",
    "Dues & Payments",
    "Payment Settings",
    "Feedback Inbox",
  ];

  // Load today's menu from the backend
  async function loadMenu() {
    setMenuLoading(true);

    try {
      const response = await fetch(`${API_URL}/menus/today`);

      if (!response.ok) {
        throw new Error(`Menu request failed: ${response.status}`);
      }

      const data = await response.json();

      const lunch = data
        .filter(
          (item) =>
            String(item.mealType).toUpperCase() === "LUNCH" &&
            item.available !== false
        )
        .map((item) => `${item.mealName} - ${item.price}`)
        .join("\n");

      const dinner = data
        .filter(
          (item) =>
            String(item.mealType).toUpperCase() === "DINNER" &&
            item.available !== false
        )
        .map((item) => `${item.mealName} - ${item.price}`)
        .join("\n");

      const updated = {
        lunch: lunch || "",
        dinner: dinner || "",
      };

      setMenu(updated);
      setLunchInput(updated.lunch);
      setDinnerInput(updated.dinner);

      localStorage.setItem("messmateMenu", JSON.stringify(updated));
      setMenuMessage("");
    } catch (error) {
      console.error("Loading menu failed:", error);

      setMenuMessage(
        "Could not load the database menu. Check that the backend is running on port 8080."
      );
    } finally {
      setMenuLoading(false);
    }
  }

  useEffect(() => {
    loadMenu();
    loadStudentsAndFeedback();
  }, []);

  async function loadStudentsAndFeedback() {
    try {
      const [studentResponse, feedbackResponse, paymentResponse] = await Promise.all([
        fetch(`${API_URL}/students`),
        fetch(`${API_URL}/feedback`),
        fetch(`${API_URL}/payments`),
      ]);
      if (studentResponse.ok) {
        const data = await studentResponse.json();
        setRegisteredStudents(Array.isArray(data) ? data : []);
      }
      if (feedbackResponse.ok) {
        const data = await feedbackResponse.json();
        setFeedbackRecords(Array.isArray(data) ? data : []);
      }
      if (paymentResponse.ok) {
        const data = await paymentResponse.json();
        setStudents(Array.isArray(data) ? data : []);
      }
      setRecordsMessage("");
    } catch (error) {
      console.error("Loading student/feedback records failed:", error);
      setRecordsMessage("Could not load student/feedback records. Check the backend connection.");
    }
  }

  async function toggleMealAvailability(meal, enabled) {
    const mealType = meal.toUpperCase();
    setMenuMessage("");
    setMenuLoading(true);
    try {
      const response = await fetch(`${API_URL}/menus?date=${getToday()}`);
      if (!response.ok) throw new Error("Could not load menu records for kitchen control.");
      const records = await response.json();
      const matching = records.filter((item) => String(item.mealType).toUpperCase() === mealType);
      if (matching.length === 0) throw new Error(`No ${meal.toLowerCase()} menu exists for today. Publish the menu first.`);
      for (const item of matching) {
        const updateResponse = await fetch(`${API_URL}/menus/${item.id}/availability`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ available: enabled }),
        });
        if (!updateResponse.ok) throw new Error(`Could not update ${meal.toLowerCase()} availability.`);
      }
      if (mealType === "LUNCH") setLunchEnabled(enabled); else setDinnerEnabled(enabled);
      await loadMenu();
      setMenuMessage(`${meal} service ${enabled ? "enabled" : "paused"} and saved to database.`);
    } catch (error) {
      setMenuMessage(error.message || "Kitchen control update failed.");
    } finally {
      setMenuLoading(false);
    }
  }

  // Format: Veg Thali - 80
  function parseMenu(text, mealType) {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const separator = line.lastIndexOf("-");

        if (separator < 1) {
          throw new Error(
            `Invalid item "${line}". Use Item Name - Price format.`
          );
        }

        const mealName = line.slice(0, separator).trim();
        const priceText = line.slice(separator + 1).trim();
        const price = Number(priceText);

        if (
          !mealName ||
          priceText === "" ||
          !Number.isFinite(price) ||
          price < 0
        ) {
          throw new Error(
            `Invalid item "${line}". Example: Veg Thali - 80`
          );
        }

        return {
          mealName,
          mealType,
          price,
          menuDate: getToday(),
          available: true,
        };
      });
  }

  // Save menu to the database
  async function saveMenu() {
    setSaved(false);
    setMenuMessage("");
    setMenuLoading(true);

    try {
      const lunchItems = lunchEnabled
        ? parseMenu(lunchInput, "LUNCH")
        : [];

      const dinnerItems = dinnerEnabled
        ? parseMenu(dinnerInput, "DINNER")
        : [];

      const allItems = [...lunchItems, ...dinnerItems];

      if (allItems.length === 0) {
        throw new Error(
          "Enter at least one item for an enabled meal."
        );
      }

      const currentResponse = await fetch(`${API_URL}/menus/today`);

      if (!currentResponse.ok) {
        throw new Error(
          `Could not check existing menu: ${currentResponse.status}`
        );
      }

      const existingItems = await currentResponse.json();

      const keyOf = (item) =>
        `${String(item.mealType).toUpperCase()}|${String(
          item.mealName
        ).trim().toLowerCase()}`;

      const existingKeys = new Set(existingItems.map(keyOf));

      const existingNames = new Set(existingItems.map(keyOf));

      // Check whether an existing item's price has changed
      for (const item of allItems) {
        if (existingNames.has(keyOf(item))) {
          const existing = existingItems.find(
            (oldItem) =>
              String(oldItem.mealType).toUpperCase() === item.mealType &&
              String(oldItem.mealName).trim().toLowerCase() ===
                item.mealName.trim().toLowerCase()
          );

          if (existing && Number(existing.price) !== item.price) {
            throw new Error(
              `${item.mealName} already exists with price ₹${existing.price}. Editing an existing price needs a backend update endpoint.`
            );
          }
        }
      }

      const itemsToCreate = allItems.filter(
        (item) => !existingKeys.has(keyOf(item))
      );

      for (const item of itemsToCreate) {
        const response = await fetch(`${API_URL}/menus`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(item),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          throw new Error(
            errorData.message ||
              `Saving menu failed: ${response.status}`
          );
        }
      }

      const updated = {
        lunch: lunchInput,
        dinner: dinnerInput,
      };

      setMenu(updated);

      localStorage.setItem(
        "messmateMenu",
        JSON.stringify(updated)
      );

      setSaved(true);

      setMenuMessage(
        itemsToCreate.length
          ? `Menu saved successfully! ${itemsToCreate.length} new item(s) added to the database.`
          : "These menu items already exist in the database. No duplicates were created."
      );
    } catch (error) {
      console.error("Saving menu failed:", error);

      setMenuMessage(
        error.message || "Could not save the menu."
      );
    } finally {
      setMenuLoading(false);
    }
  }

  // Save payment settings in browser storage
  function savePaymentSettings(event) {
    event.preventDefault();

    localStorage.setItem(
      "messmatePaymentSettings",
      JSON.stringify(paymentSettings)
    );

    setPaymentMessage(
      "Payment settings saved in this browser."
    );
  }

  // Update the current month's payment status in MySQL.
  async function updateStudentStatus(id, status) {
    try {
      const response = await fetch(`${API_URL}/payments/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Payment status update failed.");
      setStudents((previous) => previous.map((student) => student.id === id ? { ...student, ...data } : student));
      setPaymentMessage("Payment status saved to the database.");
    } catch (error) {
      setPaymentMessage(error.message || "Could not update payment status. Check backend.");
    }
  }

  const paidStudents = students.filter(
    (student) => student.status === "Paid"
  );

  const pendingStudents = students.filter(
    (student) => student.status !== "Paid"
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon">♨</span>

          <span>
            <strong>
              Mess<span>Mate</span>
            </strong>

            <small>Owner workspace</small>
          </span>
        </div>

        <div className="topbar-right">
          <span className="status-dot" />
          <span>Mess management</span>
        </div>
      </header>

      <div className="dashboard-layout">
        <aside className="sidebar">
          <p className="sidebar-label">OWNER MENU</p>

          {tabs.map((tab) => (
            <button
              key={tab}
              className={`nav-item ${
                activeTab === tab ? "active" : ""
              }`}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab}
              <span className="nav-arrow">›</span>
            </button>
          ))}

          <button
            className="logout-button"
            onClick={onHome}
            type="button"
          >
            ← Back to home
          </button>
        </aside>

        <main className="main-content">
          <div className="welcome-row">
            <div>
              <p className="eyebrow">
                MESSMATE • OWNER PORTAL
              </p>

              <h1>
                {activeTab === "Overview"
                  ? "Welcome, Mess Owner!"
                  : activeTab}
              </h1>

              <p className="muted">
                Keep your kitchen organised and your students informed.
              </p>
            </div>
          </div>

          {/* OVERVIEW */}
          {activeTab === "Overview" && (
            <>
              <section className="hero-card">
                <div>
                  <span className="hero-tag">
                    YOUR KITCHEN, IN CONTROL
                  </span>

                  <h2>
                    Good food starts
                    <br />
                    with good planning.
                  </h2>

                  <p>
                    Manage menus, meals and payments from one place.
                  </p>
                </div>

                <div className="hero-food">
                  👨‍🍳 🍲 🥗
                </div>
              </section>

              <section className="stats-grid">
                <article className="stat-card">
                  <span className="stat-icon orange">🎓</span>
                  <p>Registered students</p>
                  <h2>{students.length}</h2>
                </article>

                <article className="stat-card">
                  <span className="stat-icon green">💚</span>
                  <p>Paid students</p>
                  <h2>{paidStudents.length}</h2>
                </article>

                <article className="stat-card">
                  <span className="stat-icon purple">💳</span>
                  <p>Pending payments</p>
                  <h2>{pendingStudents.length}</h2>
                </article>
              </section>

              <section className="section-card">
                <h2>Today's menu</h2>

                <div className="meal-panel lunch">
                  <h3>☀️ Lunch</h3>
                  <p>
                    {menu.lunch || "No lunch menu published."}
                  </p>
                </div>

                <div className="meal-panel dinner">
                  <h3>🌙 Dinner</h3>
                  <p>
                    {menu.dinner || "No dinner menu published."}
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={() => setActiveTab("Publish Menu")}
                  type="button"
                >
                  Update menu →
                </button>
              </section>
            </>
          )}

          {/* KITCHEN CONTROL */}
          {activeTab === "Kitchen Control" && (
            <section className="section-card">
              <h2>Kitchen control</h2>

              {[
                ["Lunch", lunchEnabled, setLunchEnabled],
                ["Dinner", dinnerEnabled, setDinnerEnabled],
              ].map(([meal, enabled, setEnabled]) => (
                <div
                  className="meal-panel lunch"
                  key={meal}
                >
                  <h3>
                    {meal === "Lunch" ? "☀️" : "🌙"} {meal} service
                  </h3>

                  <p>
                    {enabled
                      ? `${meal} is enabled.`
                      : `${meal} is paused.`}
                  </p>

                  <button
                    className={
                      enabled
                        ? "green-button"
                        : "primary-button"
                    }
                    onClick={() => toggleMealAvailability(meal, !enabled)}
                    disabled={menuLoading}
                    type="button"
                  >
                    {enabled
                      ? `Pause ${meal.toLowerCase()}`
                      : `Enable ${meal.toLowerCase()}`}
                  </button>
                </div>
              ))}

              <p className="muted">
                Kitchen controls update menu availability in MySQL and affect what students can see and mark.
              </p>
              {menuMessage && <p className={saved ? "success-message" : "muted"}>{menuMessage}</p>}
            </section>
          )}

          {/* PUBLISH MENU */}
          {activeTab === "Publish Menu" && (
            <section className="section-card">
              <h2>Publish today's menu</h2>

              <p className="muted">
                Enter one item per line using Item Name - Price format.
              </p>

              <label
                className="field-label"
                htmlFor="owner-lunch"
              >
                Lunch menu
              </label>

              <textarea
                id="owner-lunch"
                rows={5}
                value={lunchInput}
                onChange={(event) =>
                  setLunchInput(event.target.value)
                }
                placeholder={
                  "Veg Thali - 80\nChapati - 10\nDal Rice - 40"
                }
              />

              <label
                className="field-label"
                htmlFor="owner-dinner"
              >
                Dinner menu
              </label>

              <textarea
                id="owner-dinner"
                rows={5}
                value={dinnerInput}
                onChange={(event) =>
                  setDinnerInput(event.target.value)
                }
                placeholder={"Paneer Thali - 100\nRoti - 10"}
              />

              <button
                className="primary-button"
                onClick={saveMenu}
                disabled={menuLoading}
                type="button"
              >
                {menuLoading
                  ? "Saving menu..."
                  : "Save menu to database"}
              </button>

              <button
                className="green-button"
                onClick={loadMenu}
                disabled={menuLoading}
                type="button"
              >
                Refresh from database
              </button>

              {saved && (
                <p className="success-message">
                  ✓ Menu saved!
                </p>
              )}

              {menuMessage && (
                <p
                  className="success-message"
                  role="status"
                >
                  {menuMessage}
                </p>
              )}
            </section>
          )}

          {/* STUDENT LIST */}
          {activeTab === "Student List" && (
            <section className="section-card">
              <h2>Student list</h2>

              <p className="muted">
                Registered students loaded from the MySQL database.
              </p>
              {recordsMessage && <p className="error-message">{recordsMessage}</p>}

              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Room</th>
                      <th>Payment status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(registeredStudents.length ? registeredStudents : []).map((student) => (
                      <tr key={student.id}>
                        <td>{student.fullName || student.name}<br /><small>{student.email}</small></td>
                        <td>{student.phone || "—"}</td>
                        <td>Registered</td>
                      </tr>
                    ))}
                    {registeredStudents.length === 0 && <tr><td colSpan="3">No registered students found in database.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* DUES AND PAYMENTS */}
          {activeTab === "Dues & Payments" && (
            <section className="section-card">
              <h2>Dues & payments</h2>

              <p className="muted">
                Current-month student payment records are stored in MySQL. Default monthly fee: ₹3,000.
              </p>

              <div className="stats-grid">
                <article className="stat-card">
                  <p>Monthly fee (example)</p>
                  <h2>₹3,000</h2>
                </article>

                <article className="stat-card">
                  <p>Paid students</p>
                  <h2>{paidStudents.length}</h2>
                </article>

                <article className="stat-card">
                  <p>Pending students</p>
                  <h2>{pendingStudents.length}</h2>
                </article>
              </div>

              <label
                className="field-label"
                htmlFor="paid-students"
              >
                Paid students
              </label>

              <select
                id="paid-students"
                className="payment-select"
                defaultValue=""
              >
                <option value="" disabled>
                  Select a paid student
                </option>

                {paidStudents.map((student) => (
                  <option
                    key={student.id}
                    value={student.id}
                  >
                    {student.name} — {student.room || "—"}
                  </option>
                ))}
              </select>

              <label
                className="field-label"
                htmlFor="pending-students"
              >
                Pending students
              </label>

              <select
                id="pending-students"
                className="payment-select"
                defaultValue=""
              >
                <option value="" disabled>
                  Select a pending student
                </option>

                {pendingStudents.map((student) => (
                  <option
                    key={student.id}
                    value={student.id}
                  >
                    {student.name} — {student.room || "—"}
                  </option>
                ))}
              </select>

              <h3>Update a student's payment status</h3>

              <p className="muted">
                Mark a payment as Paid only after verifying that it was received.
              </p>

              {students.map((student) => (
                <div
                  className="meal-panel lunch"
                  key={student.id}
                >
                  <h3>
                    {student.name} · {student.room || "—"}
                  </h3>

                  <p>
                    Current status:{" "}
                    <strong>{student.status}</strong>
                  </p>

                  <select
                    className="payment-select"
                    aria-label={`Payment status for ${student.name}`}
                    value={student.status}
                    onChange={(event) =>
                      updateStudentStatus(
                        student.id,
                        event.target.value
                      )
                    }
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              ))}
            </section>
          )}

          {/* PAYMENT SETTINGS */}
          {activeTab === "Payment Settings" && (
            <section className="section-card">
              <h2>Payment settings</h2>

              <p className="muted">
                These settings are currently stored in this browser.
              </p>

              <form onSubmit={savePaymentSettings}>
                <label
                  className="field-label"
                  htmlFor="owner-upi"
                >
                  Owner's UPI ID
                </label>

                <input
                  id="owner-upi"
                  className="payment-select"
                  value={paymentSettings.upiId}
                  onChange={(event) =>
                    setPaymentSettings({
                      ...paymentSettings,
                      upiId: event.target.value,
                    })
                  }
                  placeholder="Example: yourname@upi"
                />

                <label
                  className="field-label"
                  htmlFor="owner-qr"
                >
                  QR code image
                </label>

                <input
                  id="owner-qr"
                  type="file"
                  accept="image/*"
                  className="payment-select"
                  onChange={(event) => {
                    const file = event.target.files?.[0];

                    if (!file) return;

                    if (file.size > 1024 * 1024) {
                      setPaymentMessage(
                        "Please choose a QR image smaller than 1 MB."
                      );

                      event.target.value = "";
                      return;
                    }

                    const reader = new FileReader();

                    reader.onload = () =>
                      setPaymentSettings((previous) => ({
                        ...previous,
                        qrImage: String(reader.result),
                      }));

                    reader.readAsDataURL(file);
                  }}
                />

                {paymentSettings.qrImage && (
                  <div>
                    <p className="muted">QR preview</p>

                    <img
                      src={paymentSettings.qrImage}
                      alt="Owner payment QR code"
                      style={{
                        width: 180,
                        maxWidth: "100%",
                        borderRadius: 12,
                      }}
                    />

                    <button
                      type="button"
                      className="mm-secondary"
                      onClick={() =>
                        setPaymentSettings({
                          ...paymentSettings,
                          qrImage: "",
                        })
                      }
                    >
                      Remove QR image
                    </button>
                  </div>
                )}

                <label
                  className="field-label"
                  htmlFor="owner-bank"
                >
                  Bank transfer instructions
                </label>

                <textarea
                  id="owner-bank"
                  rows={3}
                  className="payment-select"
                  value={paymentSettings.bankDetails}
                  onChange={(event) =>
                    setPaymentSettings({
                      ...paymentSettings,
                      bankDetails: event.target.value,
                    })
                  }
                  placeholder="Bank name, account holder and IFSC"
                />

                <p className="field-label">
                  Payment options to offer
                </p>

                {[
                  ["upi", "UPI / QR code"],
                  ["cash", "Cash"],
                  ["bank", "Bank transfer"],
                ].map(([value, label]) => (
                  <label
                    key={value}
                    style={{
                      display: "block",
                      margin: "10px 0",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={paymentSettings.methods.includes(value)}
                      onChange={(event) => {
                        const methods = event.target.checked
                          ? [...paymentSettings.methods, value]
                          : paymentSettings.methods.filter(
                              (method) => method !== value
                            );

                        setPaymentSettings({
                          ...paymentSettings,
                          methods,
                        });
                      }}
                    />{" "}
                    {label}
                  </label>
                ))}

                <button
                  className="primary-button"
                  type="submit"
                >
                  Save payment settings
                </button>
              </form>

              {paymentMessage && (
                <p className="success-message">
                  {paymentMessage}
                </p>
              )}
            </section>
          )}

          {/* FEEDBACK INBOX */}
          {activeTab === "Feedback Inbox" && (
            <section className="section-card">
              <h2>Student feedback</h2>

              {recordsMessage && <p className="error-message">{recordsMessage}</p>}
              {feedbackRecords.length === 0 ? <p className="muted">No feedback submitted yet.</p> : feedbackRecords.map((item) => (
                <article className="meal-panel lunch" key={item.id}>
                  <p>{"⭐ ".repeat(Number(item.rating) || 0)}</p>
                  <p>{item.comment}</p>
                  <small className="muted">{item.studentName || "Student"} • {item.date || ""}</small>
                </article>
              ))}
            </section>
          )}

          <footer className="page-footer">
            Made with care for better everyday meals 💚
          </footer>
        </main>
      </div>
    </div>
  );
}