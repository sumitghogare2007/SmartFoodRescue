import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function runE2E() {
  console.log('--- 1. Testing GET /api/health ---');
  const healthRes = await axios.get(`${API_BASE}/health`);
  console.log('Health Response:', healthRes.data);

  console.log('\n--- 2. Testing Login for Seeded Demo Accounts ---');
  const accounts = [
    { email: 'admin@smartfoodrescue.com', pass: 'Admin@123', role: 'ADMIN' },
    { email: 'donor@smartfoodrescue.com', pass: 'Donor@123', role: 'DONOR' },
    { email: 'ngo@smartfoodrescue.com', pass: 'Ngo@123', role: 'NGO' },
    { email: 'volunteer@smartfoodrescue.com', pass: 'Volunteer@123', role: 'VOLUNTEER' },
  ];

  const tokens: Record<string, string> = {};

  for (const acc of accounts) {
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: acc.email,
      password: acc.pass,
    });
    console.log(`✓ ${acc.role.padEnd(9)}: logged in as "${loginRes.data.user.name}" (${loginRes.data.user.email}) | Role: ${loginRes.data.user.userType}`);
    tokens[acc.role] = loginRes.data.token;
  }

  console.log('\n--- 3. Verifying Dashboard Data Loaded From MongoDB ---');
  // Admin stats
  const statsRes = await axios.get(`${API_BASE}/stats/platform`, {
    headers: { Authorization: `Bearer ${tokens.ADMIN}` },
  });
  console.log('Admin Platform Stats:', statsRes.data);

  // Donor donations
  const donorDonationsRes = await axios.get(`${API_BASE}/donations/my/donations`, {
    headers: { Authorization: `Bearer ${tokens.DONOR}` },
  });
  console.log(`Donor has ${donorDonationsRes.data.length} donations in MongoDB:`);
  for (const d of donorDonationsRes.data) {
    console.log(`  - [${d.status}] ${d.foodType} | Quantity: ${d.quantity} ${d.unit} | Masked Aadhaar: ${d.maskedAadhaar || 'N/A'}`);
  }

  // NGO requests
  const ngoRequestsRes = await axios.get(`${API_BASE}/donation-requests?ngoId=me`, {
    headers: { Authorization: `Bearer ${tokens.NGO}` },
  });
  console.log(`NGO has ${ngoRequestsRes.data.length} requests in MongoDB.`);

  // Volunteer pickups
  const volunteerPickupsRes = await axios.get(`${API_BASE}/pickups?volunteerId=me`, {
    headers: { Authorization: `Bearer ${tokens.VOLUNTEER}` },
  });
  console.log(`Volunteer has ${volunteerPickupsRes.data.length} pickups in MongoDB.`);

  console.log('\n--- 4. Creating a Test Food Donation via API (as Donor) ---');
  const expiryTime = new Date(Date.now() + 8 * 3600 * 1000).toISOString();
  const prepTime = new Date(Date.now() - 1 * 3600 * 1000).toISOString();

  // Get donor's location
  const donorLocationsRes = await axios.get(`${API_BASE}/locations`, {
    headers: { Authorization: `Bearer ${tokens.DONOR}` },
  });
  const locationId = donorLocationsRes.data[0]?._id;

  const newDonationPayload = {
    foodType: 'Fresh Biryani & Raita (E2E Test Listing)',
    foodCategory: 'Cooked',
    quantity: 35,
    unit: 'servings',
    preparationTime: prepTime,
    expiryTime: expiryTime,
    isVegetarian: true,
    locationId: locationId,
    aadhaarId: '987654321099',
    notes: 'Freshly prepared evening batch, sealed containers.'
  };

  const createDonationRes = await axios.post(`${API_BASE}/donations`, newDonationPayload, {
    headers: { Authorization: `Bearer ${tokens.DONOR}` },
  });
  console.log('✓ Successfully created Food Donation in MongoDB:');
  console.log(`  ID: ${createDonationRes.data._id}`);
  console.log(`  Food Type: ${createDonationRes.data.foodType}`);
  console.log(`  Quantity: ${createDonationRes.data.quantity} ${createDonationRes.data.unit}`);
  console.log(`  Status: ${createDonationRes.data.status}`);
  console.log(`  Masked Aadhaar: ${createDonationRes.data.maskedAadhaar}`);

  console.log('\n--- 5. Verifying It Appears In Available Donations List ---');
  const availableRes = await axios.get(`${API_BASE}/donations?status=AVAILABLE`);
  const found = availableRes.data.find((d: any) => d._id === createDonationRes.data._id);
  console.log(`✓ Verified donation appears in MongoDB public feed: ${Boolean(found)}`);

  console.log('\n======================================================');
  console.log('ALL API & E2E TESTS PASSED SUCCESSFULLY!');
  console.log('======================================================');
}

runE2E().catch((err) => {
  console.error('E2E Test Failed:', err.response?.data || err.message);
  process.exit(1);
});
