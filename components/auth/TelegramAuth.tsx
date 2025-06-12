'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Shield } from 'lucide-react';

// Добавляем типы для Telegram
declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

interface TelegramAuthProps {
  onAuthSuccess: (user: any) => void;
  shopId: string;
}

export default function TelegramAuth({
  onAuthSuccess,
  shopId,
}: TelegramAuthProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBrowser, setIsBrowser] = useState(false);
  const telegramLoginRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Для отладки: раскомментировать строку ниже, чтобы принудительно включить режим браузера
    // setIsBrowser(true); setIsLoading(false); loadTelegramWidget(); return;

    try {
      // проверка запущено ли приложение в Telegram WebApp или в браузере
      const isTelegramWebApp =
        typeof window !== 'undefined' &&
        window.Telegram &&
        window.Telegram.WebApp;

      console.log('Telegram WebApp доступен:', !!isTelegramWebApp);
      setIsBrowser(!isTelegramWebApp);

      if (isTelegramWebApp) {
        checkTelegramAuth();
      } else {
        // Если в браузере, то показывать виджет авторизации
        setIsLoading(false);
        loadTelegramWidget();
      }
    } catch (err) {
      console.error('Ошибка при проверке окружения:', err);
      setError('Ошибка при проверке окружения');
      setIsLoading(false);
      // В случае ошибки показываем виджет авторизации
      setIsBrowser(true);
      loadTelegramWidget();
    }
  }, []);

  // Загрузка виджета авторизации Telegram
  const loadTelegramWidget = () => {
    if (typeof window !== 'undefined' && telegramLoginRef.current) {
      try {
        // Очищаем контейнер перед добавлением скрипта
        telegramLoginRef.current.innerHTML = '';

        // Создаем скрипт для виджета авторизации
        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-widget.js?22';
        // Имя бота без символа @
        script.setAttribute(
          'data-telegram-login',
          'storeTest34523452345234534Bot',
        );
        script.setAttribute('data-size', 'large');
        script.setAttribute('data-radius', '8');
        script.setAttribute('data-request-access', 'write');
        script.setAttribute('data-userpic', 'true');
        script.setAttribute(
          'data-auth-url',
          `${window.location.origin}/api/auth/telegram-login?shop_id=${shopId}`,
        );
        script.async = true;

        telegramLoginRef.current.appendChild(script);
        console.log('Виджет авторизации Telegram добавлен');
      } catch (err) {
        console.error('Ошибка при загрузке виджета Telegram:', err);
        setError('Ошибка при загрузке виджета авторизации');
      }
    }
  };

  const checkTelegramAuth = async () => {
    try {
      if (typeof window !== 'undefined') {
        const tg = (window as any).Telegram?.WebApp;

        if (tg && tg.initDataUnsafe?.user) {
          const user = tg.initDataUnsafe.user;

          // Проверяем/создаем пользователя в БД
          const response = await fetch('/api/auth/telegram', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user: user,
              initData: tg.initData,
              shopId: shopId,
            }),
          });

          if (response.ok) {
            const userData = await response.json();
            onAuthSuccess(userData);
          } else {
            setError('Ошибка авторизации');
          }
        } else {
          setError('Необходимо открыть через Telegram');
        }
      }
    } catch (err) {
      console.error('Ошибка авторизации:', err);
      setError('Ошибка подключения');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-background'>
        <Card className='w-full max-w-md mx-4'>
          <CardContent className='pt-6 text-center'>
            <div className='w-8 h-8 mx-auto mb-4 border-b-2 rounded-full animate-spin border-primary'></div>
            <p>Проверка авторизации...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isBrowser) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-background'>
        <Card className='w-full max-w-md mx-4'>
          <CardHeader className='text-center'>
            <CardTitle>Авторизация через Telegram</CardTitle>
            <CardDescription>
              Для продолжения необходимо войти через Telegram
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4 text-center'>
            <div ref={telegramLoginRef} className='flex justify-center'></div>
            {error && <p className='text-sm text-destructive'>{error}</p>}

            <div className='pt-4 mt-4 border-t'>
              <p className='mb-2 text-sm text-muted-foreground'>
                Или откройте приложение в Telegram:
              </p>
              <Button
                onClick={() => {
                  const botName = 'storeTest34523452345234534Bot';
                  window.location.href = `https://t.me/${botName}?start=shop_${shopId}`;
                }}
                className='w-full'
              >
                Открыть в Telegram
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-background'>
        <Card className='w-full max-w-md mx-4'>
          <CardHeader className='text-center'>
            <Shield className='w-12 h-12 mx-auto mb-4 text-destructive' />
            <CardTitle>Ошибка авторизации</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4 text-center'>
            <p className='text-sm text-muted-foreground'>
              Для доступа к магазину необходимо открыть приложение через
              Telegram бота.
            </p>
            <div className='space-y-2'>
              <p className='text-xs text-muted-foreground'>Инструкция:</p>
              <div className='p-3 space-y-1 text-xs text-left rounded bg-muted'>
                <p>1. Найдите бота в Telegram</p>
                <p>2. Нажмите /start</p>
                <p>3. Нажмите "Открыть магазин"</p>
              </div>
            </div>
            <Button onClick={checkTelegramAuth} className='w-full'>
              Попробовать снова
            </Button>

            <div className='pt-4 mt-4 border-t'>
              <Button
                onClick={() => {
                  const botName = 'storeTest34523452345234534Bot';
                  window.location.href = `https://t.me/${botName}?start=shop_${shopId}`;
                }}
                variant='outline'
                className='w-full'
              >
                Открыть в Telegram
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
