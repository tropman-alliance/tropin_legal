// api/telegram.js
// Обработчик бота для Telegram (вебхук на Vercel).
// Отвечает на команду /start приветствием с кнопками и ссылками.
// Токен берётся из переменной TELEGRAM_BOT_TOKEN (та же, что для заявок).
//
// ВАЖНО: после загрузки файла нужно ОДИН раз привязать вебхук — см. DEPLOY.md.

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// ===== НАСТРОЙКИ — поменяйте ссылки под себя =====
const MINIAPP_URL  = "https://https://tropin-legal.vercel.app/"; // адрес вашего мини-приложения (замените на новый адрес Vercel)
const WHATSAPP_URL = "https://wa.me/79692284269";        // WhatsApp для связи
const LAWYER_TG    = "https://t.me/V_Tropman";           // юрист в Telegram напрямую
const SITE_URL     = "https://alliance-lawyer.ru/";      // сайт
const CHANNEL_URL = "https://t.me/tropin_legal";         // появится канал — раскомментируйте и добавьте кнопку ниже
// =================================================

async function tg(method, payload) {
  return fetch("https://api.telegram.org/bot" + TOKEN + "/" + method, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

module.exports = async function handler(req, res) {
  // Telegram присылает обновления методом POST. На GET — простая заглушка-проверка.
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true, info: "telegram webhook alive" });
  }

  let update = req.body;
  if (typeof update === "string") {
    try { update = JSON.parse(update); } catch { update = {}; }
  }

  const msg = update && update.message;
  const text = msg && msg.text ? String(msg.text).trim() : "";
  const chatId = msg && msg.chat ? msg.chat.id : null;

  // Приветствие на /start
  if (chatId && text.startsWith("/start")) {
    const welcome =
      "⚖️ <b>Валерий Тропин — юрист для бизнеса</b>\n" +
      "<i>25 лет практики</i>\n\n" +
      "Опишите свою ситуацию — и за минуту получите бесплатную предварительную оценку: " +
      "какие законы на вашей стороне, что делать дальше и какие документы понадобятся.\n\n" +
      "Блокировки счёта (115/161-ФЗ), споры и суды, взыскание долгов, договоры, налоги, " +
      "корпоративные вопросы — нажмите кнопку ниже.\n\n" +
      "<i>Бесплатно. Анонимно. Без звонков.</i>";

    // Кнопки. Любую лишнюю строку можно удалить.
    const keyboard = [
      [{ text: "🟢 Задать вопрос юристу", web_app: { url: https://tropin-legal.vercel.app/ } }],
      [
        { text: "💬 WhatsApp", url: https://wa.me/79692284269 },
        { text: "✉️ Юрист в Telegram", url: https://t.me/V_Tropman },
      ],
      [{ text: "🌐 Сайт", url: https://alliance-lawyer.ru/ }],
    ];

    await tg("sendMessage", {
      chat_id: chatId,
      text: welcome,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: keyboard },
    });
  }

  // Telegram всегда должен получить ответ 200, иначе он будет слать обновление повторно.
  return res.status(200).json({ ok: true });
};
