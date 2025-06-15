// app/api/users/setup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, email, phone, default_address } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 },
      );
    }

    const supabase = createClient();

    // Проверяем, существует ли пользователь
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 - запись не найдена
      console.error('Ошибка при получении пользователя:', fetchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Если пользователь существует, обновляем его данные
    if (existingUser) {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          email,
          phone,
          default_address,
        })
        .eq('telegram_id', userId);

      if (updateError) {
        console.error('Ошибка при обновлении пользователя:', updateError);
        return NextResponse.json({ error: 'Update error' }, { status: 500 });
      }

      // Получаем обновленные данные пользователя
      const { data: updatedUser, error: getError } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', userId)
        .single();

      if (getError) {
        console.error(
          'Ошибка при получении обновленного пользователя:',
          getError,
        );
        return NextResponse.json({ error: 'Fetch error' }, { status: 500 });
      }

      return NextResponse.json(updatedUser);
    } else {
      // Если пользователь не существует, создаем тестового пользователя
      // Это только для разработки, в продакшене пользователь должен быть создан через авторизацию Telegram
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          telegram_id: userId,
          name: 'Test User',
          username: 'testuser',
          email,
          phone,
          default_address,
          manager: false,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Ошибка при создании пользователя:', insertError);
        return NextResponse.json({ error: 'Insert error' }, { status: 500 });
      }

      return NextResponse.json(newUser);
    }
  } catch (error) {
    console.error('Ошибка обработки запроса:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// import { type NextRequest, NextResponse } from "next/server"
// import { createClient } from "@/lib/supabase/server"

// export async function POST(request: NextRequest) {
//   try {
//     const { userId, email, phone, default_address } = await request.json()

//     const supabase = createClient()

//     const { data: user, error } = await supabase
//       .from("users")
//       .update({
//         email,
//         phone,
//         default_address,
//       })
//       .eq("id", userId)
//       .select()
//       .single()

//     if (error) {
//       return NextResponse.json({ error: error.message }, { status: 500 })
//     }

//     return NextResponse.json(user)
//   } catch (error) {
//     console.error("Ошибка обновления пользователя:", error)
//     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
//   }
// }
