import { Suspense } from "react"
import ShopsList from "@/components/admin/ShopsList"
import CreateShopButton from "@/components/admin/CreateShopButton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Админ панель</h1>
          <p className="text-gray-600 mt-2">Управляйте своими магазинами</p>
        </div>
        <CreateShopButton />
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>📊 Статистика</CardTitle>
            <CardDescription>Общая информация по всем магазинам</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">0</div>
                <div className="text-sm text-gray-600">Магазинов</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-sm text-gray-600">Заказов</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">$0</div>
                <div className="text-sm text-gray-600">Выручка</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">0</div>
                <div className="text-sm text-gray-600">Товаров</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🏪 Мои магазины</CardTitle>
            <CardDescription>Список всех созданных магазинов</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Загрузка...</div>}>
              <ShopsList />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
