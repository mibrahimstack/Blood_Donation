const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const port = process.env.PORT || 3000;

// MySQL Connection (Using a Pool for Vercel)
const db = mysql.createPool({
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com', 
    port: 4000,
    user: '285uJ5CPMQ3A355.root',                            
    password: process.env.DB_PASSWORD,                          
    database: 'blood_donation',
    ssl: { 
        rejectUnauthorized: true 
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ----------- ROUTES -----------

// 1. Admin Login Route
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  console.log("Login attempt received for user:", username); 

  db.query('SELECT * FROM Admin WHERE Username = ? AND Password = ?', 
    [username, password], 
    (err, results) => {
      if (err) return res.status(500).send(err);
      
      if (results.length > 0) {
        res.send({ success: true, message: 'Login successful' });
      } else {
        res.status(401).send({ success: false, message: 'Invalid username or password' });
      }
  });
});

// 2. Add Donor and Phone Numbers
app.post('/add-donor', (req, res) => {
  const { name, gender, dob, blood_type, phone_numbers } = req.body;

  db.query('INSERT INTO Donor (Name, Gender, Date_of_Birth, Blood_Type) VALUES (?, ?, ?, ?)',
    [name, gender, dob, blood_type],
    (err, result) => {
      if (err) return res.status(500).send(err);

      const donorId = result.insertId;
      const phoneInserts = phone_numbers.map(phone => [donorId, phone]);

      db.query('INSERT INTO Phone_Number (Donor_ID, Phone_Number) VALUES ?', [phoneInserts], (err2) => {
        if (err2) return res.status(500).send(err2);
        res.send({ message: 'Donor added successfully', donorId });
      });
    });
});

// 3. Add Donation
app.post('/add-donation', (req, res) => {
  const { donor_id, date, quantity, location } = req.body;
  db.query('INSERT INTO Donation (Donor_ID, Date, Quantity, Location) VALUES (?, ?, ?, ?)',
    [donor_id, date, quantity, location],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.send({ message: 'Donation recorded', donationId: result.insertId });
    });
});

// 4. Add Blood Bank
app.post('/add-blood-bank', (req, res) => {
  const { name, location, capacity, contact } = req.body;
  db.query('INSERT INTO Blood_Bank (Name, Location, Capacity, Contact_Number) VALUES (?, ?, ?, ?)',
    [name, location, capacity, contact],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.send({ message: 'Blood bank added', bankId: result.insertId });
    });
});

// 5. Add Hospital
app.post('/add-hospital', (req, res) => {
  const { name, location, contact } = req.body;
  db.query('INSERT INTO Hospital (Name, Location, Contact_Number) VALUES (?, ?, ?)',
    [name, location, contact],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.send({ message: 'Hospital added', hospitalId: result.insertId });
    });
});

// 6. Add Request
app.post('/add-request', (req, res) => {
  const { hospital_id, bank_id, blood_type, quantity, urgency, date } = req.body;
  db.query('INSERT INTO Blood_Request (Hospital_ID, Bank_ID, Blood_Type_Required, Quantity_Required, Urgency_Level, Request_Date) VALUES (?, ?, ?, ?, ?, ?)',
    [hospital_id, bank_id, blood_type, quantity, urgency, date],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.send({ message: 'Request added', requestId: result.insertId });
    });
});


// ==========================================
// SEARCH ROUTES
// ==========================================

app.get('/search-donors', (req, res) => {
  const searchTerm = req.query.q;
  const searchQuery = `%${searchTerm}%`;
  const searchId = isNaN(searchTerm) ? null : parseInt(searchTerm);

  db.query(`
    SELECT 
      d.Donor_ID,
      d.Name,
      d.Gender,
      d.Date_of_Birth,
      d.Blood_Type,
      GROUP_CONCAT(p.Phone_Number) AS Phone_Numbers
    FROM Donor d
    LEFT JOIN Phone_Number p ON d.Donor_ID = p.Donor_ID
    WHERE d.Name LIKE ? OR d.Blood_Type LIKE ? OR d.Donor_ID = ?
    GROUP BY d.Donor_ID
  `, [searchQuery, searchQuery, searchId], (err, results) => {
    if (err) return res.status(500).send(err);
    const formattedResults = results.map(donor => ({
      ...donor,
      Phone_Numbers: donor.Phone_Numbers ? donor.Phone_Numbers.split(',') : []
    }));
    res.send(formattedResults);
  });
});

app.get('/search-donations', (req, res) => {
  const searchTerm = `%${req.query.q}%`;
  const searchId = isNaN(req.query.q) ? null : parseInt(req.query.q);
  db.query(`SELECT * FROM Donation WHERE Location LIKE ? OR Donation_ID = ? OR Donor_ID = ?`, 
    [searchTerm, searchId, searchId], (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});

app.get('/search-blood-banks', (req, res) => {
  const searchTerm = `%${req.query.q}%`;
  const searchId = isNaN(req.query.q) ? null : parseInt(req.query.q);
  db.query(`SELECT * FROM Blood_Bank WHERE Name LIKE ? OR Location LIKE ? OR Bank_ID = ?`, 
    [searchTerm, searchTerm, searchId], (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});

app.get('/search-hospitals', (req, res) => {
  const searchTerm = `%${req.query.q}%`;
  const searchId = isNaN(req.query.q) ? null : parseInt(req.query.q);
  db.query(`SELECT * FROM Hospital WHERE Name LIKE ? OR Location LIKE ? OR Hospital_ID = ?`, 
    [searchTerm, searchTerm, searchId], (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});

app.get('/search-requests', (req, res) => {
  const searchTerm = `%${req.query.q}%`;
  const searchId = isNaN(req.query.q) ? null : parseInt(req.query.q);
  db.query(`SELECT * FROM Blood_Request WHERE Blood_Type_Required LIKE ? OR Urgency_Level LIKE ? OR Request_ID = ?`, 
    [searchTerm, searchTerm, searchId], (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});


// ==========================================
// FETCH ALL ROUTES (VIEW ALL BUTTONS)
// ==========================================

app.get('/donors-with-phones', (req, res) => {
  db.query(`
    SELECT 
      d.Donor_ID,
      d.Name,
      d.Gender,
      d.Date_of_Birth,
      d.Blood_Type,
      GROUP_CONCAT(p.Phone_Number) AS Phone_Numbers
    FROM Donor d
    LEFT JOIN Phone_Number p ON d.Donor_ID = p.Donor_ID
    GROUP BY d.Donor_ID
  `, (err, results) => {
    if (err) return res.status(500).send(err);
    const formattedResults = results.map(donor => ({
      ...donor,
      Phone_Numbers: donor.Phone_Numbers ? donor.Phone_Numbers.split(',') : []
    }));
    res.send(formattedResults);
  });
});

app.get('/donors', (req, res) => {
  db.query('SELECT * FROM Donor', (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});

app.get('/phone-numbers', (req, res) => {
  db.query('SELECT Donor_ID, Phone_Number FROM Phone_Number', (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});

app.get('/donations', (req, res) => {
  db.query('SELECT * FROM Donation', (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});

app.get('/blood-banks', (req, res) => {
  db.query('SELECT * FROM Blood_Bank', (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});

app.get('/hospitals', (req, res) => {
  db.query('SELECT * FROM Hospital', (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});

app.get('/requests', (req, res) => {
  db.query('SELECT * FROM Blood_Request', (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});


// ==========================================
// DATABASE AUTO-SETUP ROUTE
// ==========================================
app.get('/setup-db', async (req, res) => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS Admin (Username VARCHAR(255) UNIQUE, Password VARCHAR(255));`,
    `CREATE TABLE IF NOT EXISTS Donor (Donor_ID INT AUTO_INCREMENT PRIMARY KEY, Name VARCHAR(255), Gender VARCHAR(50), Date_of_Birth DATE, Blood_Type VARCHAR(10));`,
    `CREATE TABLE IF NOT EXISTS Phone_Number (Donor_ID INT, Phone_Number VARCHAR(50));`,
    `CREATE TABLE IF NOT EXISTS Donation (Donation_ID INT AUTO_INCREMENT PRIMARY KEY, Donor_ID INT, Date DATE, Quantity INT, Location VARCHAR(255));`,
    `CREATE TABLE IF NOT EXISTS Blood_Bank (Bank_ID INT AUTO_INCREMENT PRIMARY KEY, Name VARCHAR(255), Location VARCHAR(255), Capacity INT, Contact_Number VARCHAR(50));`,
    `CREATE TABLE IF NOT EXISTS Hospital (Hospital_ID INT AUTO_INCREMENT PRIMARY KEY, Name VARCHAR(255), Location VARCHAR(255), Contact_Number VARCHAR(50));`,
    `CREATE TABLE IF NOT EXISTS Blood_Request (Request_ID INT AUTO_INCREMENT PRIMARY KEY, Hospital_ID INT, Bank_ID INT, Blood_Type_Required VARCHAR(10), Quantity_Required INT, Urgency_Level VARCHAR(50), Request_Date DATE);`,
    `INSERT IGNORE INTO Admin (Username, Password) VALUES ('admin', 'admin123');`
  ];

  try {
    // This forces the server to run each query one at a time, in order!
    for (let q of queries) {
      await db.promise().query(q);
    }
    res.send("SUCCESS! All tables created in TiDB! You can now use your dashboard.");
  } catch (err) {
    console.error("Table creation error:", err);
    // If it fails, it will print the exact reason on your browser screen!
    res.send(`FAILED: ${err.message}`); 
  }
});

// ==========================================
// DATABASE SEED ROUTE (Generates 50 Pakistani Entries)
// ==========================================
app.get('/seed-db', async (req, res) => {
  try {
    // Data Pools
    const firstM = ['Muhammad', 'Ali', 'Usman', 'Bilal', 'Hamza', 'Tariq', 'Hassan', 'Zain', 'Imran', 'Kamran', 'Faisal', 'Zeeshan'];
    const firstF = ['Fatima', 'Aisha', 'Zainab', 'Sana', 'Hina', 'Nida', 'Khadija', 'Maryam', 'Iqra', 'Rabia', 'Sadia', 'Uzma'];
    const lasts = ['Khan', 'Ahmed', 'Afridi', 'Khattak', 'Malik', 'Javed', 'Rehman', 'Hussain', 'Shah', 'Qureshi', 'Bibi'];
    const cities = ['Peshawar', 'Mardan', 'Kohat', 'Islamabad', 'Lahore', 'Karachi', 'Rawalpindi', 'Abbottabad'];
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const hospitalBases = ['Lady Reading Hospital', 'Hayatabad Medical Complex', 'Khyber Teaching Hospital', 'Shaukat Khanum', 'PIMS', 'Aga Khan Hospital', 'Jinnah Hospital', 'Services Hospital'];
    const bankBases = ['Fatimid Foundation', 'Hamza Foundation', 'Frontier Foundation', 'PRCS Blood Bank', 'Sundas Foundation', 'Husaini Blood Bank'];

    // Helper functions for randomness
    const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    let donors = [], phones = [], hospitals = [], banks = [], donations = [], requests = [];

    // Generate 50 rows for everything!
    for (let i = 1; i <= 50; i++) {
      // 1. Donors
      const isMale = Math.random() > 0.5;
      const name = `${random(isMale ? firstM : firstF)} ${random(lasts)}`;
      const gender = isMale ? 'Male' : 'Female';
      const dob = `${randomInt(1980, 2005)}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`;
      donors.push(`('${name}', '${gender}', '${dob}', '${random(bloodTypes)}')`);

      // 2. Phone Numbers (03xx-xxxxxxx)
      phones.push(`(${i}, '03${randomInt(0, 4)}${randomInt(0, 9)}-${randomInt(1000000, 9999999)}')`);

      // 3. Hospitals
      const city = random(cities);
      hospitals.push(`('${random(hospitalBases)} ${city}', '${city}', '0${randomInt(21, 91)}-${randomInt(1000000, 9999999)}')`);

      // 4. Blood Banks
      banks.push(`('${random(bankBases)} ${city}', '${city}', ${randomInt(100, 1000)}, '0${randomInt(21, 91)}-${randomInt(1000000, 9999999)}')`);

      // 5. Donations
      donations.push(`(${randomInt(1, i)}, '2025-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}', ${randomInt(1, 3) * 250}, '${city}')`);

      // 6. Blood Requests
      requests.push(`(${randomInt(1, i)}, ${randomInt(1, i)}, '${random(bloodTypes)}', ${randomInt(1, 5)}, '${random(['Low', 'Medium', 'High', 'Critical'])}', '2026-${String(randomInt(1, 4)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}')`);
    }

    // Fire them all into the TiDB Cloud!
    await db.promise().query(`INSERT INTO Donor (Name, Gender, Date_of_Birth, Blood_Type) VALUES ${donors.join(',')}`);
    await db.promise().query(`INSERT INTO Phone_Number (Donor_ID, Phone_Number) VALUES ${phones.join(',')}`);
    await db.promise().query(`INSERT INTO Hospital (Name, Location, Contact_Number) VALUES ${hospitals.join(',')}`);
    await db.promise().query(`INSERT INTO Blood_Bank (Name, Location, Capacity, Contact_Number) VALUES ${banks.join(',')}`);
    await db.promise().query(`INSERT INTO Donation (Donor_ID, Date, Quantity, Location) VALUES ${donations.join(',')}`);
    await db.promise().query(`INSERT INTO Blood_Request (Hospital_ID, Bank_ID, Blood_Type_Required, Quantity_Required, Urgency_Level, Request_Date) VALUES ${requests.join(',')}`);

    res.send("SUCCESS! 50 random Pakistani records have been permanently added to your database!");
  } catch (err) {
    console.error("Seeding error:", err);
    res.send(`FAILED: ${err.message}`);
  }
});

// ==========================================
// SERVER STARTUP
// ==========================================
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// THIS IS THE REQUIRED LINE FOR VERCEL:
module.exports = app;