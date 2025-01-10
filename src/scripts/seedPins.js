const axios = require('axios');
const { faker } = require('@faker-js/faker');
import api from '../lib/api';

// Array of realistic categories for pins
const categories = [
  'Home Decor', 'DIY & Crafts', 'Fashion', 'Food & Recipes', 
  'Travel', 'Art', 'Photography', 'Technology', 'Fitness', 
  'Beauty', 'Garden', 'Architecture'
];

// Function to get random picsum image URL
const getPicsumUrl = () => {
  const id = Math.floor(Math.random() * 1000);
  return `https://picsum.photos/seed/${id}/800/1000`;
};

// Array of sample usernames
const usernames = [
  'creative_soul', 'design_lover', 'wanderlust_spirit', 
  'food_enthusiast', 'art_explorer', 'tech_guru', 
  'fitness_fanatic', 'nature_lover', 'style_icon'
];

const generatePin = () => {
  const category = faker.helpers.arrayElement(categories);
  const username = faker.helpers.arrayElement(usernames);
  const hasImage = faker.datatype.boolean({ probability: 0.7 }); // 70% chance of having image
  
  const pin = {
    title: faker.lorem.words({ min: 2, max: 5 }),
    description: faker.lorem.paragraphs({ min: 1, max: 2 }),
    username: username,
    category: category,
    views: faker.number.int({ min: 0, max: 5000 }),
    created_at: faker.date.past()
  };

  // Only add image_url if hasImage is true
  if (hasImage) {
    pin.image_url = getPicsumUrl();
  }

  return pin;
};

const seedPins = async (count = 100) => {
  console.log(`Starting to seed ${count} pins...`);
  let successCount = 0;
  
  for (let i = 0; i < count; i++) {
    try {
      const pin = generatePin();
      console.log('Generated pin:', pin); // Log the generated pin
      await api.post('/api/pins', pin);
      successCount++;
      console.log(`Created pin ${i + 1}/${count}`);
    } catch (error) {
      console.error(`Error creating pin ${i + 1}:`, error.message);
    }
    
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`Seeding completed! Total pins created: ${successCount}`);
};

// Run the seeder
seedPins(100); 