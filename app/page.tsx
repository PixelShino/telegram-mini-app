import { redirect } from "next/navigation"

export default function HomePage() {
  // Перенаправляем на страницу настройки
  redirect("/setup")
}
