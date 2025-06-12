import { notFound } from "next/navigation"
import TelegramShop from "@/components/shop/TelegramShop"
import { getShop } from "@/lib/api/shops"

interface TgAppPageProps {
  params: {
    id: string
  }
  searchParams: {
    user_id?: string
    username?: string
    first_name?: string
    last_name?: string
  }
}

export default async function TgAppPage({ params, searchParams }: TgAppPageProps) {
  const shop = await getShop(params.id)

  if (!shop || shop.status !== "active") {
    notFound()
  }

  // Данные пользователя Telegram из URL параметров
  const telegramUser = {
    id: searchParams.user_id,
    username: searchParams.username,
    first_name: searchParams.first_name,
    last_name: searchParams.last_name,
  }

  return <TelegramShop shop={shop} telegramUser={telegramUser} />
}
