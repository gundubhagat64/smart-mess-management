import { useState } from "react";
import "./Payment.css";

export default function Payment() {
  const [method, setMethod] = useState("Fake UPI");
  const [status, setStatus] = useState("");

  const amount = 3000;

  function handlePayment() {
    const payment = {
      amount,
      method,
      status: "Paid",
      demo: true,
      date: new Date().toISOString(),
    };

    const payments = JSON.parse(
      localStorage.getItem("messmateDemoPayments") || "[]"
    );

    payments.push(payment);
    localStorage.setItem(
      "messmateDemoPayments",
      JSON.stringify(payments)
    );

    setStatus(
      `Demo payment successful! ₹${amount} marked as Paid. No real money was charged.`
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-card">
        <h1>MessMate</h1>
        <p>Monthly Mess Fee</p>

        <h2>₹{amount.toLocaleString("en-IN")}</h2>

        <label htmlFor="payment-method">
          Select Payment Method
        </label>

        <select
          id="payment-method"
          value={method}
          onChange={(event) => {
            setMethod(event.target.value);
            setStatus("");
          }}
        >
          <option value="Fake UPI">Fake UPI</option>
          <option value="Fake Card">Fake Debit / Credit Card</option>
        </select>

        <button onClick={handlePayment}>
          Pay ₹{amount.toLocaleString("en-IN")} (Demo)
        </button>

        {status && (
          <div className="payment-success">
            ✅ {status}
          </div>
        )}

        <p className="demo-note">
          DEMO ONLY — No real payment is processed.
        </p>
      </div>
    </div>
  );
}