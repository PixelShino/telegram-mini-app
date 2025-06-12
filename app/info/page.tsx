export default function InfoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        <div className="text-6xl mb-6">🛍️</div>
        <h1 className="text-2xl font-bold mb-4">Telegram Mini App</h1>
        <p className="text-gray-600 mb-6">Добро пожаловать! Это система управления Telegram магазинами.</p>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500">Для доступа к магазину используйте ссылку с ID магазина.</p>
        </div>
      </div>
    </div>
  )
}
