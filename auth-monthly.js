const AUTH_STORAGE_KEY = "hamborghini_auth_v1";
const SESSION_UNLOCK_KEY = "hamborghini_session_unlocked";
const MONTHLY_SALES_KEY = "hamborghini_monthly_sales_v1";

// البيانات الافتراضية لأول مرة (تقدر تغيرها من جوه التطبيق في أي وقت)
const DEFAULT_CREDENTIALS = {
  username: "admin",
  password: "1234"
};

function getCredentials() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(DEFAULT_CREDENTIALS));
      return DEFAULT_CREDENTIALS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_CREDENTIALS;
  }
}

function checkLockState() {
  const overlay = document.getElementById("hamborghini-login-overlay");
  if (!overlay) return;
  const isUnlocked = sessionStorage.getItem(SESSION_UNLOCK_KEY) === "true";
  overlay.style.display = isUnlocked ? "none" : "flex";
}

function hamborghiniLogin() {
  const userVal = (document.getElementById("loginUser").value || "").trim();
  const passVal = (document.getElementById("loginPass").value || "").trim();
  const errEl = document.getElementById("loginError");
  const creds = getCredentials();

  if (userVal === creds.username && passVal === creds.password) {
    sessionStorage.setItem(SESSION_UNLOCK_KEY, "true");
    document.getElementById("loginPass").value = "";
    errEl.style.display = "none";
    checkLockState();
  } else {
    errEl.style.display = "block";
  }
}

function hamborghiniLock() {
  sessionStorage.removeItem(SESSION_UNLOCK_KEY);
  checkLockState();
}

function openChangeCredentials() {
  const current = getCredentials();
  const oldPass = prompt("أدخل كلمة المرور الحالية للتأكيد:");
  if (oldPass !== current.password) {
    alert("كلمة المرور الحالية غير صحيحة.");
    return;
  }
  const newUser = prompt("أدخل اسم المستخدم الجديد:", current.username);
  if (!newUser || !newUser.trim()) return;
  const newPass = prompt("أدخل كلمة المرور الجديدة:");
  if (!newPass || !newPass.trim()) return;

  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({ username: newUser.trim(), password: newPass.trim() })
  );
  alert("تم تحديث اسم المستخدم وكلمة المرور بنجاح.");
}

// --- نظام ذاكرة المبيعات الشهرية ---

function getMonthlySales() {
  try {
    const raw = localStorage.getItem(MONTHLY_SALES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveMonthlySales(data) {
  localStorage.setItem(MONTHLY_SALES_KEY, JSON.stringify(data));
}

// استدعِ هذه الدالة داخل completeOrder() عند تأكيد أي طلب: recordOrderToMonth(total)
function recordOrderToMonth(orderTotal) {
  const amount = Number(orderTotal);
  if (!Number.isFinite(amount) || amount <= 0) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const monthKey = `${year}-${month}`; // مثال: 2026-11

  const archive = getMonthlySales();
  if (!archive[monthKey]) {
    archive[monthKey] = {
      month: monthKey,
      ordersCount: 0,
      totalRevenue: 0
    };
  }

  archive[monthKey].ordersCount += 1;
  archive[monthKey].totalRevenue += amount;
  saveMonthlySales(archive);
}

function toggleMonthlyModal() {
  const modal = document.getElementById("monthlySalesModal");
  if (!modal) return;
  const isHidden = modal.style.display === "none" || !modal.style.display;
  if (isHidden) {
    renderMonthlySalesTable();
    modal.style.display = "flex";
  } else {
    modal.style.display = "none";
  }
}

function renderMonthlySalesTable() {
  const container = document.getElementById("monthlySalesContent");
  const archive = getMonthlySales();
  const keys = Object.keys(archive).sort().reverse();

  if (keys.length === 0) {
    container.innerHTML = '<p style="color:#aaa; text-align:center;">لا توجد مبيعات شهرية مسجلة حتى الآن.</p>';
    return;
  }

  let html = `
    <table style="width:100%; border-collapse:collapse; text-align:right; font-size:14px;">
      <thead>
        <tr style="border-bottom:2px solid #f5b700; color:#ffcc29;">
          <th style="padding:8px;">الشهر</th>
          <th style="padding:8px;">عدد الطلبات</th>
          <th style="padding:8px;">إجمالي المبيعات</th>
        </tr>
      </thead>
      <tbody>
  `;

  keys.forEach((k) => {
    const row = archive[k];
    html += `
      <tr style="border-bottom:1px solid #333;">
        <td style="padding:8px; font-weight:bold;">${row.month}</td>
        <td style="padding:8px;">${row.ordersCount} طلب</td>
        <td style="padding:8px; color:#4ade80; font-weight:bold;">${row.totalRevenue} ج</td>
      </tr>
    `;
  });

  html += "</tbody></table>";
  container.innerHTML = html;
}

// تفعيل الدخول بزر Enter
document.addEventListener("keydown", (e) => {
  const overlay = document.getElementById("hamborghini-login-overlay");
  if (overlay && overlay.style.display !== "none" && e.key === "Enter") {
    hamborghiniLogin();
  }
});

// التحقق من حالة القفل فور فتح الصفحة
checkLockState();
