import { redirect } from "next/navigation"

export default function TestShopPage() {
  // Перенаправляем на тестовый магазин
  redirect("/shop/550e8400-e29b-41d4-a716-446655440000")
}
