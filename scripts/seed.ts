import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rus-medical.com' },
    update: {},
    create: {
      email: 'admin@rus-medical.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN'
    }
  });

  console.log('✅ Admin user created:', admin.email);

  // Create sample articles
  const articles = [
    {
      title: 'Рак легень: ранні ознаки та діагностика',
      excerpt: 'Рак легень - одне з найпоширеніших онкологічних захворювань. Дізнайтеся про перші симптоми та сучасні методи діагностики.',
      category: 'Діагностика',
      image: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1200&h=800&fit=crop',
      date: '15 березня 2025',
      readTime: '7 хв',
      published: true,
      content: {
        intro: 'Рак легень залишається одним з найпоширеніших онкологічних захворювань у світі. Рання діагностика значно підвищує шанси на успішне лікування.',
        sections: [
          {
            heading: 'Перші симптоми',
            text: 'Тривалий кашель, що не проходить понад 3 тижні, кровохаркання, задишка, біль у грудях, втрата ваги без причини - це симптоми, які потребують негайного звернення до лікаря.'
          },
          {
            heading: 'Методи діагностики',
            text: 'Сучасна медицина пропонує комплексний підхід: рентгенографія грудної клітки, комп\'ютерна томографія (КТ), бронхоскопія, біопсія та аналіз пухлинних маркерів.'
          }
        ]
      }
    },
    {
      title: 'Сучасні методи лікування раку легень',
      excerpt: 'Від хірургічного втручання до таргетної терапії - огляд найефективніших методів лікування онкології легень.',
      category: 'Лікування',
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&h=800&fit=crop',
      date: '10 березня 2025',
      readTime: '8 хв',
      published: true,
      content: {
        intro: 'Лікування раку легень вимагає індивідуального підходу та комбінації різних методів терапії залежно від стадії та типу пухлини.',
        sections: [
          {
            heading: 'Хірургічне лікування',
            text: 'Лобектомія, сегментектомія або пульмонектомія - види операцій залежно від розміру та локалізації пухлини. Сучасні малоінвазивні техніки скорочують період відновлення.'
          }
        ]
      }
    }
  ];

  for (const article of articles) {
    await prisma.article.upsert({
      where: { title: article.title },
      update: {},
      create: article
    });
  }

  console.log('✅ Sample articles created');

  // Create sample gallery images
  const galleryImages = [
    {
      title: 'Медичне обладнання',
      description: 'Сучасне обладнання для діагностики та лікування',
      imageUrl: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&h=600&fit=crop',
      imageType: 'image',
      order: 1,
      published: true
    },
    {
      title: 'Хірургічний кабінет',
      description: 'Сучасний хірургічний кабінет',
      imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop',
      imageType: 'image',
      order: 2,
      published: true
    }
  ];

  for (const image of galleryImages) {
    await prisma.galleryImage.upsert({
      where: { imageUrl: image.imageUrl },
      update: {},
      create: image
    });
  }

  console.log('✅ Sample gallery images created');
  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
