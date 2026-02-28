import axios from 'axios';

async function quickTest() {
  try {
    console.log('Testing registration endpoint...');
    const response = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Quick Test User',
      phone: '+919999999999',
      password: 'test123',
      userType: 'client',
      location: {
        type: 'Point',
        coordinates: [72.8777, 19.0760]
      },
      address: 'Test Address'
    });
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    console.error('Full error:', error);
  }
}

quickTest();
