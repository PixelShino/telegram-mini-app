import { Bot, webhookCallback } from "grammy"
import { createClient } from "@supabase/supabase-js"
import dedent from "dedent"
import express from "express"

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

// Команда /start
bot.command("start", async (ctx) => {
  const user = ctx.from

  // Сохраняем пользователя в БД
  await saveUserToDatabase(user)

  const welcomeMessage = dedent`
    🛍️ Добро пожаловать в наш магазин!
    
    Для начала покупок нажмите кнопку ниже:
  `

  await ctx.reply(welcomeMessage, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🛒 Открыть магазин", web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL}/shop/1` } }],
      ],
    },
  })
})

// Сохранение пользователя в БД
async function saveUserToDatabase(user) {
  try {
    const { data, error } = await supabase
      .from("users")
      .upsert([
        {
          id: user.id,
          name: `${user.first_name} ${user.last_name || ""}`.trim(),
          username: user.username,
          avatar: null,
          email: null,
          phone: null,
          default_address: null,
          manager: false,
        },
      ])
      .select()

    if (error) {
      console.error("Ошибка сохранения пользователя:", error)
    } else {
      console.log("Пользователь сохранен:", data)
    }
  } catch (error) {
    console.error("Ошибка при сохранении пользователя:", error)
  }
}

// Обработка контактов
bot.on("message:contact", async (ctx) => {
  const contact = ctx.message.contact
  const userId = ctx.from.id

  try {
    const { error } = await supabase.from("users").update({ phone: contact.phone_number }).eq("id", userId)

    if (!error) {
      await ctx.reply("✅ Контакт сохранен!")
    }
  } catch (error) {
    console.error("Ошибка сохранения контакта:", error)
  }
})

// Создание Express сервера для webhook
const app = express()
app.use(express.json())

// Webhook endpoint
app.use("/webhook", webhookCallback(bot, "express"))

// Запуск сервера
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Bot server running on port ${PORT}`)
})

export default bot
