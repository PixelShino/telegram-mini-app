'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const createTestData = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/test-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Произошла ошибка');
      }
    } catch (err) {
      setError(`Ошибка: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Получаем текущий URL для отображения правильной ссылки
  const currentUrl =
    typeof window !== 'undefined' ? window.location.origin : '';
  const shopUrl = `${currentUrl}/shop/550e8400-e29b-41d4-a716-446655440000`;

  return (
    <div className='min-h-screen p-4 bg-gray-50'>
      <div className='max-w-2xl mx-auto'>
        <div className='mb-8 text-center'>
          <h1 className='mb-4 text-3xl font-bold'>
            Настройка Telegram Mini App
          </h1>
          <p className='text-gray-600'>
            Создайте тестовые данные для проверки работы магазина
          </p>
        </div>

        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>1. Создание тестовых данных</CardTitle>
              <CardDescription>
                Создаст тестовый магазин с товарами, пользователем и заказом для
                проверки функциональности
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={createTestData}
                disabled={loading}
                className='w-full'
              >
                {loading ? 'Создание...' : 'Создать тестовые данные'}
              </Button>

              {error && (
                <div className='p-4 mt-4 border border-red-200 rounded-lg bg-red-50'>
                  <h3 className='font-semibold text-red-800'>Ошибка:</h3>
                  <p className='text-red-600'>{error}</p>
                </div>
              )}

              {result && (
                <div className='p-4 mt-4 border border-green-200 rounded-lg bg-green-50'>
                  <h3 className='mb-2 font-semibold text-green-800'>
                    Успешно создано!
                  </h3>
                  <div className='space-y-2'>
                    <p className='text-green-700'>
                      <strong>Магазин:</strong> {result.shop?.name}
                    </p>
                    <p className='text-green-700'>
                      <strong>Товаров:</strong> {result.products?.length || 0}
                    </p>
                    <div className='mt-4'>
                      <Button asChild>
                        <a
                          href={result.shopUrl}
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          Открыть тестовый магазин
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Быстрые ссылки</CardTitle>
              <CardDescription>
                Полезные ссылки для тестирования и настройки
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid gap-3'>
                <Button variant='outline' asChild>
                  <a href='/test-shop' target='_blank' rel='noreferrer'>
                    Тестовый магазин
                  </a>
                </Button>
                <Button variant='outline' asChild>
                  <a href='/admin' target='_blank' rel='noreferrer'>
                    Админ панель
                  </a>
                </Button>
                <Button variant='outline' asChild>
                  <a href='/telegram-test' target='_blank' rel='noreferrer'>
                    Тест Telegram WebApp
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. URL для Telegram бота</CardTitle>
              <CardDescription>
                Используйте этот URL в настройках Mini App
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='p-4 rounded-lg bg-blue-50'>
                <h4 className='mb-2 font-semibold'>URL для BotFather:</h4>
                <div className='p-3 bg-white border rounded'>
                  <code className='text-sm break-all'>{shopUrl}</code>
                </div>
                <div className='flex gap-2 mt-3'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => navigator.clipboard.writeText(shopUrl)}
                  >
                    Копировать URL
                  </Button>
                  <Button variant='outline' size='sm' asChild>
                    <a href={shopUrl} target='_blank' rel='noopener noreferrer'>
                      Открыть магазин
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Проверка переменных окружения</CardTitle>
              <CardDescription>
                Убедитесь, что Supabase настроен правильно
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between'>
                  <span>NEXT_PUBLIC_SUPABASE_URL:</span>
                  <span
                    className={
                      process.env.NEXT_PUBLIC_SUPABASE_URL
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    {process.env.NEXT_PUBLIC_SUPABASE_URL
                      ? 'Настроен'
                      : 'Не настроен'}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span>NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
                  <span
                    className={
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                      ? 'Настроен'
                      : 'Не настроен'}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span>TELEGRAM_BOT_TOKEN:</span>
                  <span
                    className={
                      process.env.TELEGRAM_BOT_TOKEN
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    {process.env.TELEGRAM_BOT_TOKEN
                      ? 'Настроен'
                      : 'Не настроен'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
