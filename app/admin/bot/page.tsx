import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import BotAdminInstructions from "@/components/admin/BotAdminInstructions"

export default function BotAdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Telegram Бот Админка</h1>
          <p className="text-gray-600 mt-2">Инструкции по использованию бота для администрирования</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>🤖 Команды бота</CardTitle>
            <CardDescription>Список команд для управления магазином через Telegram</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Загрузка...</div>}>
              <BotAdminInstructions />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
