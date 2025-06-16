// Вспомогательная функция для форматирования адреса
export function formatAddressFromUser(user: any): string {
  const parts = [];

  if (user.country) parts.push(user.country);
  if (user.city) parts.push(user.city);
  if (user.street) parts.push(`ул. ${user.street}`);
  if (user.house_number) parts.push(`д. ${user.house_number}`);

  if (!user.is_private_house) {
    if (user.apartment) parts.push(`кв. ${user.apartment}`);
    if (user.entrance) parts.push(`подъезд ${user.entrance}`);
    if (user.floor) parts.push(`этаж ${user.floor}`);
    if (user.intercom_code) parts.push(`домофон ${user.intercom_code}`);
  }

  return parts.length > 0 ? parts.join(', ') : 'Не указан';
}

// Вспомогательная функция для получения текста статуса
export function getStatusText(status: string): string {
  switch (status) {
    case 'pending':
      return 'Ожидает обработки';
    case 'processing':
      return 'В обработке';
    case 'shipping':
      return 'Доставляется';
    case 'completed':
      return 'Выполнен';
    case 'cancelled':
      return 'Отменен';
    default:
      return status;
  }
}
