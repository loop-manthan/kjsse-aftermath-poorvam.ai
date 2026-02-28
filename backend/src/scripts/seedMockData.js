import mongoose from 'mongoose';
import User from '../models/User.model.js';
import Job from '../models/Job.model.js';
import 'dotenv/config';

const mockClients = [
  {
    name: 'Rajesh Kumar',
    phone: '9876543210',
    email: 'rajesh@example.com',
    password: 'password123',
    userType: 'client',
    location: {
      type: 'Point',
      coordinates: [72.8777, 19.0760]
    },
    address: 'Andheri West, Mumbai, Maharashtra'
  },
  {
    name: 'Priya Sharma',
    phone: '9876543211',
    email: 'priya@example.com',
    password: 'password123',
    userType: 'client',
    location: {
      type: 'Point',
      coordinates: [77.5946, 12.9716]
    },
    address: 'Koramangala, Bangalore, Karnataka'
  },
  {
    name: 'Amit Patel',
    phone: '9876543212',
    email: 'amit@example.com',
    password: 'password123',
    userType: 'client',
    location: {
      type: 'Point',
      coordinates: [72.5714, 23.0225]
    },
    address: 'Satellite, Ahmedabad, Gujarat'
  }
];

const mockWorkers = [
  {
    name: 'Ramesh Singh',
    phone: '9876543220',
    email: 'ramesh@example.com',
    password: 'password123',
    userType: 'worker',
    categories: ['plumber', 'electrician'],
    location: {
      type: 'Point',
      coordinates: [72.8800, 19.0800]
    },
    address: 'Andheri East, Mumbai, Maharashtra',
    rating: 4.5,
    totalRatings: 120,
    experience: {
      years: 8,
      description: 'Experienced plumber and electrician. Specialized in residential repairs and installations.',
      specializations: ['Emergency repairs', 'Installation', 'Maintenance']
    },
    aadhaar: {
      number: 'XXXX-XXXX-1234',
      documentUrl: '/uploads/aadhaar/mock_1.jpg',
      isVerified: true,
      verifiedAt: new Date()
    },
    earnings: {
      total: 45000,
      thisMonth: 8500,
      pendingAmount: 2000
    }
  },
  {
    name: 'Suresh Yadav',
    phone: '9876543221',
    email: 'suresh@example.com',
    password: 'password123',
    userType: 'worker',
    categories: ['carpenter', 'painter'],
    location: {
      type: 'Point',
      coordinates: [72.8750, 19.0750]
    },
    address: 'Bandra West, Mumbai, Maharashtra',
    rating: 4.8,
    totalRatings: 85,
    experience: {
      years: 12,
      description: 'Expert carpenter with focus on custom furniture and interior work.',
      specializations: ['Custom furniture', 'Interior work', 'Repairs']
    },
    aadhaar: {
      number: 'XXXX-XXXX-5678',
      documentUrl: '/uploads/aadhaar/mock_2.jpg',
      isVerified: true,
      verifiedAt: new Date()
    },
    earnings: {
      total: 67000,
      thisMonth: 12000,
      pendingAmount: 3500
    }
  },
  {
    name: 'Vijay Kumar',
    phone: '9876543222',
    email: 'vijay@example.com',
    password: 'password123',
    userType: 'worker',
    categories: ['ac-technician', 'electrician'],
    location: {
      type: 'Point',
      coordinates: [77.5950, 12.9720]
    },
    address: 'Indiranagar, Bangalore, Karnataka',
    rating: 4.3,
    totalRatings: 65,
    experience: {
      years: 5,
      description: 'AC technician and electrician. Quick service and reliable.',
      specializations: ['AC installation', 'AC repair', 'Electrical wiring']
    },
    aadhaar: {
      number: 'XXXX-XXXX-9012',
      documentUrl: '/uploads/aadhaar/mock_3.jpg',
      isVerified: true,
      verifiedAt: new Date()
    },
    earnings: {
      total: 38000,
      thisMonth: 6500,
      pendingAmount: 1500
    }
  },
  {
    name: 'Dinesh Sharma',
    phone: '9876543223',
    email: 'dinesh@example.com',
    password: 'password123',
    userType: 'worker',
    categories: ['cleaner', 'driver'],
    location: {
      type: 'Point',
      coordinates: [72.5720, 23.0230]
    },
    address: 'Vastrapur, Ahmedabad, Gujarat',
    rating: 4.6,
    totalRatings: 95,
    experience: {
      years: 3,
      description: 'Professional cleaner and driver. Punctual and trustworthy.',
      specializations: ['Deep cleaning', 'Office cleaning', 'Local driving']
    },
    aadhaar: {
      number: 'XXXX-XXXX-3456',
      documentUrl: '/uploads/aadhaar/mock_4.jpg',
      isVerified: true,
      verifiedAt: new Date()
    },
    earnings: {
      total: 28000,
      thisMonth: 5000,
      pendingAmount: 1000
    }
  },
  {
    name: 'Arjun Reddy',
    phone: '9876543224',
    email: 'arjun@example.com',
    password: 'password123',
    userType: 'worker',
    categories: ['plumber'],
    location: {
      type: 'Point',
      coordinates: [72.8820, 19.0820]
    },
    address: 'Powai, Mumbai, Maharashtra',
    rating: 4.2,
    totalRatings: 45,
    experience: {
      years: 6,
      description: 'Plumbing specialist for residential and commercial properties.',
      specializations: ['Pipe repairs', 'Bathroom fittings', 'Water heater installation']
    },
    aadhaar: {
      number: 'XXXX-XXXX-7890',
      documentUrl: '/uploads/aadhaar/mock_5.jpg',
      isVerified: true,
      verifiedAt: new Date()
    },
    earnings: {
      total: 32000,
      thisMonth: 7000,
      pendingAmount: 2500
    }
  }
];

const mockJobs = [
  {
    description: 'Kitchen sink is leaking badly. Need urgent repair.',
    category: 'plumber',
    paymentOffer: 500,
    location: {
      type: 'Point',
      coordinates: [72.8790, 19.0770]
    },
    address: 'Andheri West, Mumbai',
    status: 'pending'
  },
  {
    description: 'Need to install new ceiling fan in bedroom',
    category: 'electrician',
    paymentOffer: 800,
    location: {
      type: 'Point',
      coordinates: [72.8780, 19.0780]
    },
    address: 'Andheri East, Mumbai',
    status: 'pending'
  },
  {
    description: 'AC not cooling properly. Need servicing.',
    category: 'ac-technician',
    paymentOffer: 600,
    location: {
      type: 'Point',
      coordinates: [77.5940, 12.9710]
    },
    address: 'Koramangala, Bangalore',
    status: 'pending'
  },
  {
    description: 'Deep cleaning required for 2BHK apartment',
    category: 'cleaner',
    paymentOffer: 1200,
    location: {
      type: 'Point',
      coordinates: [72.5710, 23.0220]
    },
    address: 'Satellite, Ahmedabad',
    status: 'pending'
  },
  {
    description: 'Need carpenter for custom bookshelf installation',
    category: 'carpenter',
    paymentOffer: 2500,
    location: {
      type: 'Point',
      coordinates: [72.8760, 19.0760]
    },
    address: 'Bandra West, Mumbai',
    status: 'pending'
  }
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await User.deleteMany({});
    await Job.deleteMany({});
    console.log('🗑️  Cleared existing data');

    const clients = await User.create(mockClients);
    console.log(`✅ Created ${clients.length} clients`);

    const workers = await User.create(mockWorkers);
    console.log(`✅ Created ${workers.length} workers`);

    const jobsWithClients = mockJobs.map((job, index) => ({
      ...job,
      clientId: clients[index % clients.length]._id,
      pricing: {
        clientBudget: job.paymentOffer,
        finalPrice: job.paymentOffer,
        negotiationStatus: 'pending'
      }
    }));

    const jobs = await Job.create(jobsWithClients);
    console.log(`✅ Created ${jobs.length} pending jobs`);

    const assignedJob = await Job.create({
      clientId: clients[0]._id,
      workerId: workers[0]._id,
      description: 'Bathroom tap replacement - urgent',
      category: 'plumber',
      paymentOffer: 700,
      pricing: {
        clientBudget: 700,
        finalPrice: 700,
        negotiationStatus: 'accepted'
      },
      location: {
        type: 'Point',
        coordinates: [72.8800, 19.0800]
      },
      address: 'Andheri East, Mumbai',
      status: 'assigned',
      assignedAt: new Date()
    });

    const inProgressJob = await Job.create({
      clientId: clients[1]._id,
      workerId: workers[1]._id,
      description: 'Living room painting work',
      category: 'painter',
      paymentOffer: 3500,
      pricing: {
        clientBudget: 3500,
        finalPrice: 3500,
        negotiationStatus: 'accepted'
      },
      location: {
        type: 'Point',
        coordinates: [77.5950, 12.9720]
      },
      address: 'Indiranagar, Bangalore',
      status: 'in_progress',
      assignedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      workDuration: {
        startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
      }
    });

    const completedJob = await Job.create({
      clientId: clients[2]._id,
      workerId: workers[2]._id,
      description: 'AC gas refilling',
      category: 'ac-technician',
      paymentOffer: 1500,
      pricing: {
        clientBudget: 1500,
        finalPrice: 1500,
        negotiationStatus: 'accepted'
      },
      location: {
        type: 'Point',
        coordinates: [72.5720, 23.0230]
      },
      address: 'Vastrapur, Ahmedabad',
      status: 'completed',
      assignedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      workDuration: {
        startedAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 22 * 60 * 60 * 1000),
        totalHours: 1
      },
      payment: {
        method: 'cash',
        status: 'completed',
        paidAt: new Date(Date.now() - 21 * 60 * 60 * 1000)
      },
      completedAt: new Date(Date.now() - 22 * 60 * 60 * 1000)
    });

    console.log('✅ Created test jobs with different statuses');
    console.log('\n📊 Mock Data Summary:');
    console.log(`   - Clients: ${clients.length}`);
    console.log(`   - Workers: ${workers.length}`);
    console.log(`   - Pending Jobs: ${jobs.length}`);
    console.log(`   - Assigned Jobs: 1`);
    console.log(`   - In Progress Jobs: 1`);
    console.log(`   - Completed Jobs: 1`);
    console.log('\n🔐 Login Credentials:');
    console.log('   Client: 9876543210 / password123');
    console.log('   Worker: 9876543220 / password123');
    console.log('\n✅ Database seeded successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
