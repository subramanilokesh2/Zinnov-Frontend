import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const COLORS = {
  background: "#f5f8ff",
  primary: "#1a237e",
  accent: "#ffb300",
  text: "#222b45",
};

// Allow Zinnov & Draup (Vishnu)
const ALLOWED_DOMAINS = ["zinnov.com", "draup.com"];

const styles = {
  container: {
    minHeight: "100vh",
    background: COLORS.background,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Segoe UI, sans-serif",
  },
  card: {
    background: "#fff",
    padding: "2.5rem 2rem",
    borderRadius: "18px",
    boxShadow: "0 8px 32px rgba(26,35,126,0.12)",
    width: "100%",
    maxWidth: "420px",
  },
  title: {
    color: COLORS.primary,
    fontWeight: 700,
    fontSize: "2rem",
    marginBottom: "0.5rem",
    letterSpacing: "1px",
    textAlign: "center",
  },
  subtitle: {
    color: COLORS.text,
    fontSize: "1rem",
    marginBottom: "2rem",
    textAlign: "center",
  },
  label: {
    color: COLORS.primary,
    fontWeight: 600,
    marginBottom: "0.5rem",
    display: "block",
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "8px",
    border: `1px solid ${COLORS.primary}33`,
    marginBottom: "1.25rem",
    fontSize: "1rem",
    outline: "none",
    transition: "border 0.2s",
  },
  button: {
    width: "100%",
    padding: "0.8rem",
    background: COLORS.primary,
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: 700,
    fontSize: "1.05rem",
    cursor: "pointer",
    transition: "background 0.2s, opacity .2s",
    marginBottom: "0.75rem",
  },
  error: {
    color: "#d32f2f",
    fontSize: "0.95rem",
    marginBottom: "1rem",
    textAlign: "center",
  },
  hint: {
    fontSize: ".85rem",
    color: "#5b6275",
    textAlign: "center",
    marginTop: ".25rem",
  },
};

function validateEmail(email) {
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  const domain = email.slice(at + 1).toLowerCase();
  return ALLOWED_DOMAINS.includes(domain);
}

const Signup = () => {
  const [email, setEmail] = useState("");
  const [empId, setEmpId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSignup(e) {
    e.preventDefault();
    setError("");

    if (!validateEmail(email)) {
      setError(`Please use your official email (${ALLOWED_DOMAINS.join(" / ")}).`);
      return;
    }
    if (!/^[A-Za-z0-9_-]{3,}$/.test(empId)) {
      // Your allowlist contains numeric and non-numeric IDs like DBS0216, contract-2
      setError("Please enter a valid Employee ID (letters, numbers, underscore or hyphen).");
      return;
    }

    try {
      setLoading(true);

      const r = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), empId: empId.trim() }),
      });

      if (!r.ok) {
        const msg = await r.json().catch(() => ({}));
        throw new Error(msg?.error || "Login failed");
      }

      const data = await r.json(); // { token, user }
      const { token, user } = data || {};

      // Persist auth:
      // - Prefer in-memory/HttpOnly cookies for security,
      //   but here we store token to localStorage for SPA fetch calls.
      localStorage.setItem("authToken", token);
      localStorage.setItem("authUser", JSON.stringify(user));
      Cookies.set("session", "active", { expires: 1 }); // Optional UX cookie
      sessionStorage.setItem("userEmail", user?.email || email);

      toast.success("Login Successful! Redirecting to Dashboard...", {
        position: "top-center",
        autoClose: 1200,
        onClose: () => navigate("/dashboard"),
      });
    } catch (err) {
      console.error(err);
      toast.error(
        err?.message === "Invalid credentials"
          ? "Invalid credentials. Please try again."
          : `Login error: ${err?.message || "Something went wrong"}`,
        { position: "top-center", autoClose: 2000 }
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <ToastContainer />
      <form style={styles.card} onSubmit={handleSignup} autoComplete="off">
        <div style={styles.title}>Sign In</div>
        <div style={styles.subtitle}>
          Welcome to Zinnov Platform!
          <br />
          Use your official credentials to continue.
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <label style={styles.label} htmlFor="email">
          Office Email
        </label>
        <input
          style={styles.input}
          type="email"
          id="email"
          placeholder="e.g. john.doe@zinnov.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          required
          disabled={loading}
        />

        <label style={styles.label} htmlFor="empid">
          Employee ID
        </label>
        <input
          style={styles.input}
          type="text"
          id="empid"
          placeholder="e.g. 397 / DBS0216 / contract-2"
          value={empId}
          onChange={(e) => setEmpId(e.target.value)}
          required
          disabled={loading}
        />

        <button
          style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
          type="submit"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <div style={styles.hint}>
          Access is controlled by your department/role and, in some cases, specific allowlists.
        </div>
      </form>
    </div>
  );
};

export default Signup;
