// api/lead.js
// Доставка заявки: уведомление в Telegram + письмо на почту.
// Все секреты (токен бота, chat_id, ключ web3forms) берутся из переменных
// окружения и НЕ попадают на страницу. Vercel поднимает файл как /api/lead.

function esc(x) {
  return String(x == null ? "" : x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function assessmentText(a) {
  if (!a) return "—";
  let s = a.summary || "";
  if (a.norms && a.norms.length) {
    s += "\nНормы: " + a.norms.map((n) => [n.ref, n.note].filter(Boolean).join(" — ")).join("; ");
  }
  return s.trim() || "—";
}
function telegramHTML(l) {
  let t = "🆕 <b>Новая заявка — Валерий Тропин</b>\n\n";
  t += `📂 <b>Направление:</b> ${esc(l.category)}\n`;
  t += `👤 <b>Имя:</b> ${esc(l.name || "—")}\n`;
  t += `📞 <b>Контакт:</b> ${esc(l.contact)}\n`;
  if (l.tgUser) t += `✈️ <b>Telegram:</b> ${esc(l.tgUser)}\n`;
  t += `📝 <b>Ситуация:</b> ${esc(l.description)}`;
  if (l.assessment && l.assessment.summary) {
    t += `\n\n🤖 <b>Предв. оценка ИИ:</b>\n${esc(l.assessment.summary)}`;
    if (l.assessment.norms && l.assessment.norms.length) {
      t += "\n" + l.assessment.norms.map((n) => "• " + esc([n.ref, n.note].filter(Boolean).join(" — "))).join("\n");
    }
  }
  return t;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  let lead = req.body;
  if (typeof lead === "string") { try { lead = JSON.parse(lead); } catch { lead = {}; } }
  lead = lead || {};

  const result = { telegram: "skipped", email: "skipped" };

  // --- Telegram ---
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (token && chatId) {
    try {
      const tr = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: telegramHTML(lead), parse_mode: "HTML", disable_web_page_preview: true }),
      });
      const td = await tr.json();
      result.telegram = td && td.ok ? "ok" : "error";
    } catch { result.telegram = "error"; }
  }

  // --- Email (web3forms) ---
  const wkey = process.env.WEB3FORMS_KEY;
  if (wkey) {
    try {
      const er = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          access_key: wkey,
          subject: `Новая заявка (Telegram) — ${lead.category || "Обращение"}`,
          from_name: "Сайт-помощник · Валерий Тропин",
          "Имя": lead.name || "—",
          "Контакт": lead.contact || "—",
          "Telegram": lead.tgUser || "—",
          "Направление": lead.category || "—",
          "Ситуация": lead.description || "—",
          "Оценка ИИ": assessmentText(lead.assessment),
        }),
      });
      const ed = await er.json();
      result.email = ed && ed.success ? "ok" : "error";
    } catch { result.email = "error"; }
  }

  return res.status(200).json(result);
};
