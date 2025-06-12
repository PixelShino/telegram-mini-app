export default function BotAdminInstructions() {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Как настроить бота для администрирования:</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Создайте бота через @BotFather</li>
          <li>Получите токен бота</li>
          <li>Добавьте токен в настройки магазина</li>
          <li>Настройте команды бота через /setcommands в @BotFather</li>
        </ol>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Команды для администрирования:</h3>
        <div className="grid gap-3">
          <div className="border p-3 rounded-lg">
            <code className="font-bold">/start</code>
            <p className="text-sm text-gray-600 mt-1">Начало работы с ботом и приветственное сообщение</p>
          </div>
          <div className="border p-3 rounded-lg">
            <code className="font-bold">/stats</code>
            <p className="text-sm text-gray-600 mt-1">Показать статистику магазина (заказы, продажи, товары)</p>
          </div>
          <div className="border p-3 rounded-lg">
            <code className="font-bold">/orders</code>
            <p className="text-sm text-gray-600 mt-1">Список последних заказов с возможностью управления</p>
          </div>
          <div className="border p-3 rounded-lg">
            <code className="font-bold">/products</code>
            <p className="text-sm text-gray-600 mt-1">Управление товарами (просмотр, добавление, редактирование)</p>
          </div>
          <div className="border p-3 rounded-lg">
            <code className="font-bold">/addproduct</code>
            <p className="text-sm text-gray-600 mt-1">Добавить новый товар (запускает интерактивный процесс)</p>
          </div>
          <div className="border p-3 rounded-lg">
            <code className="font-bold">/settings</code>
            <p className="text-sm text-gray-600 mt-1">Настройки магазина (название, описание, приветствие)</p>
          </div>
          <div className="border p-3 rounded-lg">
            <code className="font-bold">/help</code>
            <p className="text-sm text-gray-600 mt-1">Показать справку по командам</p>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Пример команд для @BotFather:</h3>
        <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
          {`stats - Статистика магазина
orders - Управление заказами
products - Список товаров
addproduct - Добавить товар
settings - Настройки магазина
help - Справка по командам`}
        </pre>
      </div>
    </div>
  )
}
