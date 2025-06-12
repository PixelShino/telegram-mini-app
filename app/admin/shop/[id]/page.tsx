import { notFound } from "next/navigation"
import ShopEditor from "@/components/admin/ShopEditor"
import { getShop } from "@/lib/api/shops"

interface ShopPageProps {
  params: {
    id: string
  }
}

export default async function ShopPage({ params }: ShopPageProps) {
  const shop = await getShop(params.id)

  if (!shop) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ShopEditor shop={shop} />
    </div>
  )
}
