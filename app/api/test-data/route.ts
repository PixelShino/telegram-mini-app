import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = createClient()

  try {
    // Создаем тестовый магазин
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .upsert([
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Тестовый Магазин",
          description: "Демонстрационный магазин для проверки функций",
          bot_username: "test_shop_bot",
          status: "active",
          settings: {
            welcome_message: "Добро пожаловать в тестовый магазин!",
            currency: "USD",
          },
        },
      ])
      .select()

    if (shopError) {
      console.error("Ошибка создания магазина:", shopError)
      return NextResponse.json({ error: shopError.message }, { status: 500 })
    }

    // Создаем тестовые товары (убираем imageUrl если колонка не существует)
    const testProducts = [
      {
        shop_id: "550e8400-e29b-41d4-a716-446655440000",
        name: "iPhone 15 Pro",
        description: "Новейший iPhone с камерой Pro и чипом A17 Pro. Доступен в разных цветах.",
        price: 999.0,
        status: "active",
      },
      {
        shop_id: "550e8400-e29b-41d4-a716-446655440000",
        name: "MacBook Air M3",
        description: "Мощный и легкий ноутбук с чипом M3. Идеален для работы и творчества.",
        price: 1299.0,
        status: "active",
      },
      {
        shop_id: "550e8400-e29b-41d4-a716-446655440000",
        name: "AirPods Pro",
        description: "Беспроводные наушники с активным шумоподавлением и пространственным звуком.",
        price: 249.0,
        status: "active",
      },
      {
        shop_id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Apple Watch Series 9",
        description: "Умные часы с множеством функций для здоровья и фитнеса.",
        price: 399.0,
        status: "active",
      },
      {
        shop_id: "550e8400-e29b-41d4-a716-446655440000",
        name: "iPad Pro",
        description: "Профессиональный планшет с M2 чипом и поддержкой Apple Pencil.",
        price: 799.0,
        status: "active",
      },
      {
        shop_id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Magic Keyboard",
        description: "Беспроводная клавиатура с подсветкой клавиш и Touch ID.",
        price: 179.0,
        status: "active",
      },
    ]

    // Сначала попробуем создать товары без imageUrl
    let products
    try {
      const { data: productsData, error: productsError } = await supabase.from("products").upsert(testProducts).select()

      if (productsError) {
        console.error("Ошибка создания товаров:", productsError)
        return NextResponse.json({ error: productsError.message }, { status: 500 })
      }
      products = productsData
    } catch (error) {
      console.error("Ошибка при создании товаров:", error)
      return NextResponse.json({ error: "Ошибка создания товаров" }, { status: 500 })
    }

    // Создаем тестового пользователя
    const { data: user, error: userError } = await supabase
      .from("telegram_users")
      .upsert([
        {
          telegram_id: 123456789,
          username: "testuser",
          first_name: "Тест",
          last_name: "Пользователь",
          language_code: "ru",
        },
      ])
      .select()

    if (userError) {
      console.error("Ошибка создания пользователя:", userError)
    }

    return NextResponse.json({
      success: true,
      message: "Тестовые данные успешно созданы!",
      shop: shop[0],
      products: products,
      shopUrl: `/shop/${shop[0].id}`,
    })
  } catch (error) {
    console.error("Ошибка создания тестовых данных:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Используйте POST запрос для создания тестовых данных",
    endpoints: {
      createTestData: "POST /api/test-data",
      testShop: "/test-shop",
      directShopLink: "/shop/550e8400-e29b-41d4-a716-446655440000",
    },
  })
}
