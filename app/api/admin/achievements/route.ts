import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '';
function isAdmin(req: NextRequest) {
  return req.headers.get('x-admin-password') === ADMIN_PASSWORD;
}

const DEFAULT_ACHIEVEMENTS = [
  { name: 'Pierwszy krok',         description: 'Zeskanuj swój pierwszy budynek w Karwi',          icon: '👣', color: '#2A8EC9', conditionType: 'total_count',    conditionValue: 1,  conditionCategory: null,     order: 0 },
  { name: 'Odkrywca',              description: 'Odkryj 3 miejsca w Karwi',                         icon: '🔭', color: '#0F5F92', conditionType: 'total_count',    conditionValue: 3,  conditionCategory: null,     order: 1 },
  { name: 'Poszukiwacz przygód',   description: 'Odwiedź 5 różnych miejsc',                         icon: '🗺️', color: '#F0A500', conditionType: 'total_count',    conditionValue: 5,  conditionCategory: null,     order: 2 },
  { name: 'Znawca Karwi',          description: 'Odkryj 7 miejsc i stań się prawdziwym znawcą',     icon: '⭐', color: '#F0A500', conditionType: 'total_count',    conditionValue: 7,  conditionCategory: null,     order: 3 },
  { name: 'Mistrz Karwi',          description: 'Odkryj wszystkie miejsca w Karwi!',                icon: '👑', color: '#C27D00', conditionType: 'total_all',      conditionValue: 0,  conditionCategory: null,     order: 4 },
  { name: 'Amator Plaży',          description: 'Odkryj 2 miejsca na plaży lub przy morzu',         icon: '🏖️', color: '#2A9D8F', conditionType: 'category_count', conditionValue: 2,  conditionCategory: 'beach',  order: 5 },
  { name: 'Miłośnik Natury',       description: 'Odkryj wszystkie przyrodnicze atrakcje Karwi',     icon: '🌿', color: '#2D6A4F', conditionType: 'category_count', conditionValue: 2,  conditionCategory: 'nature', order: 6 },
  { name: 'Kucharz Kaszubski',     description: 'Odwiedź restaurację w Karwi',                      icon: '🐟', color: '#E76F51', conditionType: 'category_count', conditionValue: 1,  conditionCategory: 'food',   order: 7 },
];

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let achievements = await prisma.achievement.findMany({ orderBy: { order: 'asc' } });

  if (achievements.length === 0) {
    await prisma.achievement.createMany({ data: DEFAULT_ACHIEVEMENTS });
    achievements = await prisma.achievement.findMany({ orderBy: { order: 'asc' } });
  }

  return NextResponse.json(achievements);
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, description, icon, color, conditionType, conditionValue, conditionCategory, order } = await req.json();
  if (!name || !conditionType) return NextResponse.json({ error: 'name i conditionType są wymagane' }, { status: 400 });

  const achievement = await prisma.achievement.create({
    data: {
      name,
      description: description ?? '',
      icon: icon ?? '🏆',
      color: color ?? '#0F5F92',
      conditionType,
      conditionValue: conditionValue ?? 1,
      conditionCategory: conditionCategory || null,
      order: order ?? 0,
    },
  });
  return NextResponse.json(achievement, { status: 201 });
}
