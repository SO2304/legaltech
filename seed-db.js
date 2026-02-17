const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seed() {
  try {
    // Check if avocat already exists
    const existingAvocat = await prisma.avocat.findFirst();
    
    if (existingAvocat) {
      console.log('Avocat already exists:', existingAvocat.email);
      return;
    }
    
    // Create default avocat
    const avocat = await prisma.avocat.create({
      data: {
        email: 'test@avocat.fr',
        passwordHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // SHA256 of "password"
        nom: 'Dupont',
        prenom: 'Jean'
      }
    });
    
    console.log('Created avocat:', avocat.email);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
