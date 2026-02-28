import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../src/models/Category.model.js';

dotenv.config();

const categories = [
  {
    name: 'plumber',
    displayName: 'Plumber',
    description: 'Plumbing services including pipe repair, leak fixing, tap installation',
    keywords: ['plumber', 'pipe', 'leak', 'tap', 'faucet', 'drain', 'water', 'geyser', 'bathroom', 'toilet', 'sink', 'नल', 'पाइप', 'पानी', 'गीजर']
  },
  {
    name: 'electrician',
    displayName: 'Electrician',
    description: 'Electrical services including wiring, light installation, fan repair',
    keywords: ['electrician', 'electric', 'wiring', 'light', 'fan', 'switch', 'socket', 'power', 'electricity', 'बिजली', 'लाइट', 'पंखा', 'स्विच']
  },
  {
    name: 'carpenter',
    displayName: 'Carpenter',
    description: 'Carpentry services including furniture repair, door installation',
    keywords: ['carpenter', 'wood', 'furniture', 'door', 'window', 'cabinet', 'table', 'chair', 'बढ़ई', 'लकड़ी', 'फर्नीचर', 'दरवाजा']
  },
  {
    name: 'painter',
    displayName: 'Painter',
    description: 'Painting services for walls, furniture, and interiors',
    keywords: ['painter', 'paint', 'wall', 'color', 'painting', 'पेंटर', 'रंग', 'दीवार', 'पेंटिंग']
  },
  {
    name: 'cleaner',
    displayName: 'Cleaner',
    description: 'Cleaning services for homes and offices',
    keywords: ['cleaner', 'cleaning', 'clean', 'maid', 'sweep', 'mop', 'dust', 'सफाई', 'झाड़ू', 'पोछा']
  },
  {
    name: 'mechanic',
    displayName: 'Mechanic',
    description: 'Vehicle repair and maintenance services',
    keywords: ['mechanic', 'car', 'bike', 'vehicle', 'repair', 'मैकेनिक', 'गाड़ी', 'मरम्मत']
  },
  {
    name: 'ac_technician',
    displayName: 'AC Technician',
    description: 'Air conditioner installation, repair, and maintenance',
    keywords: ['ac', 'air conditioner', 'cooling', 'hvac', 'एसी', 'एयर कंडीशनर']
  },
  {
    name: 'pest_control',
    displayName: 'Pest Control',
    description: 'Pest control and fumigation services',
    keywords: ['pest', 'insects', 'rats', 'cockroach', 'termite', 'कीट', 'चूहा', 'कॉकरोच']
  },
  {
    name: 'general',
    displayName: 'General Service',
    description: 'General household services',
    keywords: ['general', 'help', 'service', 'work', 'सामान्य', 'मदद']
  }
];

async function seedCategories() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    await Category.deleteMany({});
    console.log('🗑️  Cleared existing categories');

    await Category.insertMany(categories);
    console.log('✅ Categories seeded successfully');

    const count = await Category.countDocuments();
    console.log(`📊 Total categories: ${count}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();
