// Initialize AOS animations
AOS.init();

const API_BASE = 'https://rocketverify.onrender.com';
const API_KEY = 'b46f39693914cc0dc6a2b9af7971e1bf';

const liveLogs = document.getElementById('liveLogs');
const requestResult = document.getElementById('requestResult');
const verifyResult = document.getElementById('verifyResult');
const emailStatus = document.getElementById('emailStatus');
const healthStatus = document.getElementById('healthStatus');
const backBtn = document.getElementById('backBtn');
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');

// Utility: Add message to live logs panel
function addLog(message) {
  const time = new Date().toLocaleTimeString();
  liveLogs.innerHTML += `[${time}] ${message}<br>`;
  liveLogs.scrollTop = liveLogs.scrollHeight;
}

// Utility: Create status HTML with icons
function createStatusHTML(success, text) {
  if (success) {
    return `
      <span class="flex items-center gap-1 text-green-600 font-bold" role="status" aria-live="polite">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" focusable="false" width="20" height="20">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        ${text}
      </span>`;
  } else {
    return `
      <span class="flex items-center gap-1 text-red-600 font-bold" role="alert" aria-live="assertive">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" focusable="false" width="20" height="20">
          <line x1="18" y1="6" x2="6" y2="18" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
          <line x1="6" y1="6" x2="18" y2="18" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
        </svg>
        ${text}
      </span>`;
  }
}

// Toggle mobile menu
menuBtn?.addEventListener('click', () => {
  if (!mobileMenu) return;
  mobileMenu.classList.toggle('hidden');
  addLog('Toggled mobile menu.');
});

// Handle "Request Verification Code" form submission
document.getElementById('requestForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;

  const payload = {
    company: form.company.value.trim(),
    username: form.username.value.trim(),
    email: form.email.value.trim()
  };

  addLog(`Requesting verification code for ${payload.email}...`);
  requestResult.textContent = 'Loading...';

  try {
    const res = await fetch(`${API_BASE}/request-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    requestResult.textContent = JSON.stringify(data, null, 2);
    addLog(`Received verification code response for ${payload.email}.`);
  } catch (err) {
    requestResult.textContent = 'Network error while requesting code.';
    addLog('Network error while requesting verification code.');
  }
});

// Handle "Verify Code" form submission
document.getElementById('verifyForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;

  const payload = {
    email: form.email.value.trim(),
    code: form.code.value.trim()
  };

  addLog(`Verifying code for ${payload.email}...`);
  verifyResult.textContent = 'Loading...';

  try {
    const res = await fetch(`${API_BASE}/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    verifyResult.textContent = JSON.stringify(data, null, 2);
    addLog(`Code verification completed for ${payload.email}.`);
  } catch (err) {
    verifyResult.textContent = 'Network error while verifying code.';
    addLog('Network error while verifying code.');
  }
});

// Handle "Send Custom Email" button click
document.getElementById('sendEmailBtn').addEventListener('click', async (e) => {
  e.preventDefault();

  const to = document.getElementById('emailTo').value.trim();
  const subject = document.getElementById('emailSubject').value.trim() || "Notification";
  const company_name = document.getElementById('companyName').value.trim();
  const bodyText = document.getElementById('emailBody').value.trim();
  const linkText = document.getElementById('linkText').value.trim();
  const linkUrl = document.getElementById('linkUrl').value.trim();

  emailStatus.style.color = '';
  emailStatus.textContent = '';

  if (!to || !company_name || !bodyText) {
    emailStatus.style.color = 'red';
    emailStatus.textContent = 'Please fill in Recipient Email, Company Name, and Message body.';
    addLog('Failed to send email: missing required fields.');
    return;
  }

  const emailHtml = `
    <p>${bodyText}</p>
    ${linkText && linkUrl ? `<p><a href="${linkUrl}" style="color:#4F46E5; font-weight:bold; text-decoration:none;">${linkText}</a></p>` : ''}
    <p><small>— ${company_name}</small></p>
  `;

  addLog(`Sending email to ${to}...`);

  try {
    const res = await fetch(`${API_BASE}/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        to,
        subject,
        company_name,
        html: emailHtml
      })
    });

    const data = await res.json();

    if (res.ok) {
      emailStatus.style.color = 'green';
      emailStatus.textContent = 'Email sent successfully.';
      addLog(`Email sent to ${to} successfully.`);
    } else {
      emailStatus.style.color = 'red';
      emailStatus.textContent = `Error sending email: ${data.error || res.statusText}`;
      addLog(`Error sending email: ${data.error || res.statusText}`);
    }
  } catch (err) {
    emailStatus.style.color = 'red';
    emailStatus.textContent = 'Network error while sending email.';
    addLog('Network error while sending email.');
  }
});

// Check Email Server Health with retries
async function checkHealth(retries = 3, delayMs = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (res.ok) {
        const data = await res.json();
        healthStatus.innerHTML = createStatusHTML(true, `Server Healthy: ${data.status || 'OK'}`);
        addLog('Email server health check successful.');
        return;
      } else {
        throw new Error(res.statusText);
      }
    } catch (err) {
      addLog(`Health check attempt ${i+1} failed: ${err.message}`);
      healthStatus.innerHTML = createStatusHTML(false, 'Server Unreachable');
      if (i < retries - 1) {
        await new Promise(res => setTimeout(res, delayMs));
      }
    }
  }
}
checkHealth();

// Back to Home button click handler
backBtn.addEventListener('click', () => {
  addLog('Navigating back to home.');
  window.location.href = 'index.html';
});