'use client';

import { useEffect, useState } from 'react';

export default function TelegramTestPage() {
  const [telegramInfo, setTelegramInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Проверяем наличие Telegram WebApp
    const tg = (window as any).Telegram?.WebApp;

    if (tg) {
      try {
        // Инициализируем WebApp
        tg.ready();
        tg.expand();

        setTelegramInfo({
          platform: tg.platform,
          version: tg.version,
          colorScheme: tg.colorScheme,
          themeParams: tg.themeParams,
          isExpanded: tg.isExpanded,
          viewportHeight: tg.viewportHeight,
          viewportStableHeight: tg.viewportStableHeight,
          headerColor: tg.headerColor,
          backgroundColor: tg.backgroundColor,
          initData: tg.initData ? 'Присутствует' : 'Отсутствует',
          initDataUnsafe: tg.initDataUnsafe
            ? {
                user: tg.initDataUnsafe.user
                  ? {
                      id: tg.initDataUnsafe.user.id,
                      first_name: tg.initDataUnsafe.user.first_name,
                      username: tg.initDataUnsafe.user.username,
                    }
                  : 'Отсутствует',
                start_param: tg.initDataUnsafe.start_param,
              }
            : 'Отсутствует',
        });
      } catch (err) {
        setError(
          `Ошибка инициализации: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    } else {
      setError('Telegram WebApp не обнаружен');
    }

    // Получаем информацию о запросе
    fetch('/api/telegram/test')
      .then((res) => res.json())
      .then((data) => {
        setTelegramInfo((prev) => ({ ...prev, request: data }));
      })
      .catch((err) => {
        setError(`Ошибка API: ${err.message}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='mb-4 text-4xl'>🔍</div>
          <p>Проверка Telegram WebApp...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen p-4 bg-gray-50'>
      <div className='max-w-lg p-6 mx-auto bg-white rounded-lg shadow-md'>
        <h1 className='mb-4 text-2xl font-bold'>Telegram WebApp Test</h1>

        {error ? (
          <div className='px-4 py-3 mb-4 text-red-700 bg-red-100 border border-red-400 rounded'>
            <strong>Ошибка:</strong> {error}
          </div>
        ) : (
          <div className='px-4 py-3 mb-4 text-green-700 bg-green-100 border border-green-400 rounded'>
            <strong>Успех!</strong> Telegram WebApp обнаружен и инициализирован.
          </div>
        )}

        <div className='mt-6'>
          <h2 className='mb-2 text-xl font-semibold'>Отладочная информация:</h2>
          <pre className='p-4 overflow-x-auto text-sm bg-gray-100 rounded'>
            {JSON.stringify(telegramInfo, null, 2)}
          </pre>
        </div>

        <div className='mt-6'>
          <h2 className='mb-2 text-xl font-semibold'>Инструкции:</h2>
          <ol className='pl-5 space-y-2 list-decimal'>
            <li>
              Убедитесь, что вы открываете это приложение через Telegram бота
            </li>
            <li>
              Проверьте, что в BotFather правильно настроен URL для Mini App
            </li>
            <li>
              URL должен быть в формате:{' '}
              <code>https://yourdomain.com/tgapp/SHOP_ID</code>
            </li>
            <li>
              Проверьте, что скрипт Telegram WebApp загружен
              (telegram-web-app.js)
            </li>
          </ol>
        </div>

        <div className='flex justify-center mt-6'>
          <button
            onClick={() => window.location.reload()}
            className='px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600'
          >
            Обновить страницу
          </button>
        </div>
      </div>
    </div>
  );
}
