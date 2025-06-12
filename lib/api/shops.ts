import { createClient } from "@/lib/supabase/server"

export async function getShopData(id: string) {
  const supabase = createClient()

  const { data: shop, error } = await supabase
    .from("shops")
    .select(`
      *,
      products (*)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching shop:", error)
    return null
  }

  return shop
}

// Добавляем недостающий экспорт getShop
export async function getShop(id: string) {
  return await getShopData(id)
}
