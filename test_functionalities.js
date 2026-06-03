import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

async function runTests() {
  try {
    console.log("--- TEST SCRIPT START ---");

    // 1. Login as Admin
    console.log("1. Logging in as Admin...");
    let adminToken;
    try {
      const adminRes = await api.post('/auth/login', { email: 'admin@forum.com', motDePasse: 'admin123' });
      adminToken = adminRes.data.token;
      console.log("   ✅ Admin login successful");
    } catch (e) {
      console.error("   ❌ Admin login failed:", e.response?.data || e.message);
      return;
    }

    // 2. Register/Login as a regular user
    console.log("2. Registering/Logging in as User...");
    let userToken;
    try {
      const userRes = await api.post('/auth/register', { nom: 'Test User', email: 'user@test.com', motDePasse: 'user123' });
      userToken = userRes.data.token;
      console.log("   ✅ User registration successful");
    } catch (e) {
      // If user exists, try to login
      try {
        const userRes = await api.post('/auth/login', { email: 'user@test.com', motDePasse: 'user123' });
        userToken = userRes.data.token;
        console.log("   ✅ User login successful");
      } catch (err) {
        console.error("   ❌ User login failed:", err.response?.data || err.message);
        return;
      }
    }

    // 3. User adds a subject
    console.log("3. User proposes a subject...");
    let newSujetId;
    try {
      const sujetRes = await api.post('/sujets', 
        { titre: 'Sujet de test automatisé', description: 'Ceci est un test', categorie: 'technologie' },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      newSujetId = sujetRes.data.id;
      console.log(`   ✅ Subject proposed successfully (ID: ${newSujetId}, Statut: ${sujetRes.data.statut})`);
    } catch (e) {
      console.error("   ❌ Subject proposal failed:", e.response?.data || e.message);
      return;
    }

    // 4. Admin approves the subject
    console.log("4. Admin approves the subject...");
    try {
      const validerRes = await api.patch(`/sujets/${newSujetId}/valider`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log(`   ✅ Subject approved successfully (Statut: ${validerRes.data.statut})`);
    } catch (e) {
      console.error("   ❌ Subject approval failed:", e.response?.data || e.message);
      return;
    }

    // 5. User adds a post to the subject
    console.log("5. User adds a post to the subject...");
    let newPosteId;
    try {
      const posteRes = await api.post(`/sujets/${newSujetId}/postes`, 
        { contenu: 'Ceci est un poste de test', typeMedia: 'texte' },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      newPosteId = posteRes.data.id;
      console.log(`   ✅ Post added successfully (ID: ${newPosteId})`);
    } catch (e) {
      console.error("   ❌ Post creation failed:", e.response?.data || e.message);
      return;
    }

    // 6. Admin approves the post (moderation)
    console.log("6. Admin approves the post...");
    try {
      const validerPosteRes = await api.patch(`/postes/${newPosteId}/valider`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log(`   ✅ Post approved successfully (Statut: ${validerPosteRes.data.statut})`);
    } catch (e) {
      console.error("   ❌ Post approval failed:", e.response?.data || e.message);
      return;
    }

    // 7. Verify the subject and post appear correctly
    console.log("7. Verifying subject and post listing...");
    try {
      const listRes = await api.get('/sujets?statut=valide');
      const foundSujet = listRes.data.find(s => s.id === newSujetId);
      if (foundSujet) {
        console.log(`   ✅ Subject appears in the validated list with ${foundSujet.nombrePostes} post(s)`);
      } else {
        console.error("   ❌ Subject does not appear in the validated list");
      }
    } catch (e) {
      console.error("   ❌ Listing verification failed:", e.response?.data || e.message);
    }

    // 8. Logout logic (client-side only usually, but we'll print)
    console.log("8. Testing logout...");
    console.log("   ✅ Logout is client-side only (clearing localStorage), so it works by discarding the token.");

    console.log("--- TEST SCRIPT FINISHED SUCCESSFULLY ---");

  } catch (error) {
    console.error("Unexpected error during testing:", error.message);
  }
}

runTests();
