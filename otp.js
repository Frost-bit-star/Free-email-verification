// stackverify.vercel.app/otp.js

(() => {
  const showError = (msg) => {
    const error = document.getElementById("error");
    if (error) error.textContent = msg;
  };

  const getFormData = () => ({
    username: document.getElementById("username")?.value.trim(),
    email: document.getElementById("email")?.value.trim(),
    phone: document.getElementById("phone")?.value.trim(),
    password: document.getElementById("password")?.value.trim()
  });

  const scriptTag = document.currentScript;
  const company = scriptTag?.getAttribute("data-company") || "StackVerify";
  const registerEndpoint = scriptTag?.getAttribute("data-register-endpoint");
  const redirectUrl = scriptTag?.getAttribute("data-redirect") || "/";

  if (!registerEndpoint) {
    console.error("❌ StackVerify OTP: Missing data-register-endpoint attribute.");
    showError("OTP config error: register endpoint not set.");
    return;
  }

  async function sendOtp() {
    const formData = getFormData();
    if (!formData.username || !formData.email || !formData.phone || !formData.password) {
      showError("❗ Please fill all fields.");
      return;
    }

    showError("📧 Sending OTP...");
    try {
      const res = await fetch("https://verify-email-api-ma40.onrender.com/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          username: formData.username,
          email: formData.email
        })
      });

      const data = await res.json();
      if (data.message?.includes("sent")) {
        document.getElementById("otpSection")?.classList.remove("hidden");
        window._formData = formData;
        showError("✅ OTP sent to your email!");
      } else {
        showError(data.message || "❌ Failed to send OTP.");
      }
    } catch (err) {
      console.error(err);
      showError("❌ Error contacting OTP service.");
    }
  }

  async function verifyAndRegister() {
    const code = document.getElementById("otp")?.value.trim();
    const email = window._formData?.email;

    if (!email || !code || code.length !== 6) {
      showError("⚠️ Enter a valid 6-digit OTP.");
      return;
    }

    showError("🔍 Verifying OTP...");
    try {
      const res = await fetch("https://verify-email-api-ma40.onrender.com/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code })
      });

      const data = await res.json();

      if (data.valid === true) {
        showError("✅ OTP verified! Registering...");
        await registerUser(window._formData);
      } else {
        showError(data.message || "❌ Invalid or expired OTP.");
      }
    } catch (err) {
      console.error(err);
      showError("❌ Error verifying OTP.");
    }
  }

  async function registerUser(formData) {
    try {
      const res = await fetch(registerEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.success) {
        alert("🎉 Registration successful!");
        window.location.href = redirectUrl;
      } else {
        showError(data.error || "❌ Registration failed.");
      }
    } catch (err) {
      console.error(err);
      showError("❌ Server error during registration.");
    }
  }

  document.getElementById("sendOtpBtn")?.addEventListener("click", sendOtp);
  document.getElementById("verifyOtpBtn")?.addEventListener("click", verifyAndRegister);
})();