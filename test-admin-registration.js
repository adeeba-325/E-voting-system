const testData = {
  name: "Test Admin",
  department: "CSE",
  email: "testadmin123@gmail.com",
  password: "1234"
};

const testAdminRegistration = async () => {
  console.log('🧪 Testing Admin Registration...\n');
  
  try {
    console.log('📮 Sending POST request to http://localhost:5000/api/admin/register');
    console.log('📦 Payload:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:5000/api/admin/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log(`\n📊 Response Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log('📋 Response Body:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Registration successful!');
    } else {
      console.log('\n❌ Registration failed!');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testAdminRegistration();
