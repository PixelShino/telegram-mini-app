'use client';

import { useState, useEffect } from 'react';
import TelegramAuth from '@/components/auth/TelegramAuth';
// import UserSetup from '@/components/user/UserSetup';
import ShopContent from '@/components/shop/ShopContent';
import { Toaster } from 'react-hot-toast';

export default function ShopPage({
  params,
}: {
  params: { shopId: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const [user, setUser] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    // Проверяем, открыто ли приложение в Telegram WebApp
    const isTelegramWebApp =
      typeof window !== 'undefined' &&
      window.Telegram &&
      window.Telegram.WebApp;

    setIsTelegram(!!isTelegramWebApp);
  }, []);

  useEffect(() => {
    fetchShop();
  }, [params.shopId]);

  const fetchShop = async () => {
    try {
      const response = await fetch(`/api/shops/${params.shopId}`);
      if (response.ok) {
        const shopData = await response.json();
        setShop(shopData);
      }
    } catch (error) {
      console.error('Ошибка загрузки магазина:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
  };

  const handleUserSetupComplete = (userData: any) => {
    setUser(userData);
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='w-8 h-8 border-b-2 rounded-full animate-spin border-primary'></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <h1 className='mb-2 text-2xl font-bold'>Магазин не найден</h1>
          <p className='text-muted-foreground'>Проверьте правильность ссылки</p>
        </div>
      </div>
    );
  }

  // Если пользователь не авторизован
  if (!user) {
    return (
      <TelegramAuth onAuthSuccess={handleAuthSuccess} shopId={params.shopId} />
    );
  }

  // Если пользователь не заполнил обязательные данные и это не Telegram
  // if ((!user.email || !user.phone) && !isTelegram) {
  //   return <UserSetup user={user} onComplete={handleUserSetupComplete} />;
  // }
  // Показываем магазин
  return (
    <>
      <ShopContent
        shop={shop}
        user={user}
        telegramUser={user}
        isTelegram={isTelegram}
      />
      <Toaster position='top-center' />
    </>
  );
}
