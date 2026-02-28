import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

let clientToken = '';
let workerToken = '';
let clientId = '';
let workerId = '';
let jobId = '';

const testClient = {
  name: 'Test Client',
  phone: '+919876543210',
  email: 'client@test.com',
  password: 'password123',
  userType: 'client',
  location: {
    type: 'Point',
    coordinates: [72.8777, 19.0760]
  },
  address: 'Mumbai, Maharashtra'
};

const testWorker = {
  name: 'Test Worker',
  phone: '+919876543211',
  email: 'worker@test.com',
  password: 'password123',
  userType: 'worker',
  location: {
    type: 'Point',
    coordinates: [72.8800, 19.0800]
  },
  address: 'Mumbai, Maharashtra',
  categories: ['plumber', 'electrician']
};

async function testRegisterClient() {
  console.log('\n🧪 Testing Client Registration...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, testClient);
    clientToken = response.data.token;
    clientId = response.data.user.id;
    console.log('✅ Client registered successfully');
    console.log('   Token:', clientToken.substring(0, 20) + '...');
    console.log('   User ID:', clientId);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

async function testRegisterWorker() {
  console.log('\n🧪 Testing Worker Registration...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, testWorker);
    workerToken = response.data.token;
    workerId = response.data.user.id;
    console.log('✅ Worker registered successfully');
    console.log('   Token:', workerToken.substring(0, 20) + '...');
    console.log('   User ID:', workerId);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

async function testLogin() {
  console.log('\n🧪 Testing Login...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      phone: testClient.phone,
      password: testClient.password
    });
    console.log('✅ Login successful');
    console.log('   User:', response.data.user.name);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

async function testCreateJob() {
  console.log('\n🧪 Testing Job Creation...');
  try {
    const response = await axios.post(
      `${BASE_URL}/jobs/create`,
      {
        description: 'My tap is leaking and needs urgent repair',
        paymentOffer: 500,
        location: {
          type: 'Point',
          coordinates: [72.8777, 19.0760]
        },
        address: 'Mumbai, Maharashtra'
      },
      {
        headers: { Authorization: `Bearer ${clientToken}` }
      }
    );
    jobId = response.data.job._id;
    console.log('✅ Job created successfully');
    console.log('   Job ID:', jobId);
    console.log('   Category:', response.data.job.category);
    console.log('   Description:', response.data.job.description);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

async function testFindWorker() {
  console.log('\n🧪 Testing Worker Matching...');
  try {
    const response = await axios.post(
      `${BASE_URL}/matching/find-worker`,
      { jobId },
      {
        headers: { Authorization: `Bearer ${clientToken}` }
      }
    );
    console.log('✅ Worker matched successfully');
    console.log('   Worker:', response.data.job.workerId.name);
    console.log('   Distance:', response.data.matchDetails.distance.toFixed(2), 'km');
    console.log('   Match Score:', response.data.matchDetails.matchScore.toFixed(2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

async function testGetMyJobs() {
  console.log('\n🧪 Testing Get My Jobs (Worker)...');
  try {
    const response = await axios.get(`${BASE_URL}/jobs/my-jobs`, {
      headers: { Authorization: `Bearer ${workerToken}` }
    });
    console.log('✅ Jobs retrieved successfully');
    console.log('   Total jobs:', response.data.jobs.length);
    if (response.data.jobs.length > 0) {
      console.log('   First job status:', response.data.jobs[0].status);
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

async function testAcceptJob() {
  console.log('\n🧪 Testing Job Acceptance...');
  try {
    const response = await axios.patch(
      `${BASE_URL}/jobs/${jobId}/accept`,
      {},
      {
        headers: { Authorization: `Bearer ${workerToken}` }
      }
    );
    console.log('✅ Job accepted successfully');
    console.log('   Status:', response.data.job.status);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

async function testGetCategories() {
  console.log('\n🧪 Testing Get Categories...');
  try {
    const response = await axios.get(`${BASE_URL}/categories`);
    console.log('✅ Categories retrieved successfully');
    console.log('   Total categories:', response.data.categories.length);
    console.log('   Categories:', response.data.categories.map(c => c.name).join(', '));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting API Tests...\n');
  console.log('=' .repeat(50));
  
  await testGetCategories();
  await testRegisterClient();
  await testRegisterWorker();
  await testLogin();
  await testCreateJob();
  await testFindWorker();
  await testGetMyJobs();
  await testAcceptJob();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ All tests completed!\n');
}

runTests().catch(console.error);
