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

// Search Donors Route
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
    if (err) {
      console.error('Error searching donors:', err);
      return res.status(500).send(err);
    }
    
    const formattedResults = results.map(donor => ({
      ...donor,
      Phone_Numbers: donor.Phone_Numbers ? donor.Phone_Numbers.split(',') : []
    }));
    
    res.send(formattedResults);
  });
});

// Search Donations
app.get('/search-donations', (req, res) => {
  const searchTerm = `%${req.query.q}%`;
  const searchId = isNaN(req.query.q) ? null : parseInt(req.query.q);
  db.query(`SELECT * FROM Donation WHERE Location LIKE ? OR Donation_ID = ? OR Donor_ID = ?`, 
    [searchTerm, searchId, searchId], (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});

// Search Blood Banks
app.get('/search-blood-banks', (req, res) => {
  const searchTerm = `%${req.query.q}%`;
  const searchId = isNaN(req.query.q) ? null : parseInt(req.query.q);
  db.query(`SELECT * FROM Blood_Bank WHERE Name LIKE ? OR Location LIKE ? OR Bank_ID = ?`, 
    [searchTerm, searchTerm, searchId], (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});

// Search Hospitals
app.get('/search-hospitals', (req, res) => {
  const searchTerm = `%${req.query.q}%`;
  const searchId = isNaN(req.query.q) ? null : parseInt(req.query.q);
  db.query(`SELECT * FROM Hospital WHERE Name LIKE ? OR Location LIKE ? OR Hospital_ID = ?`, 
    [searchTerm, searchTerm, searchId], (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});

// Search Requests
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

// 7. Get Donors with Phones
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
    if (err) {
      console.error('Error fetching donors with phones:', err);
      return res.status(500).send(err);
    }
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
// SERVER STARTUP
// ==========================================
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// THIS IS THE REQUIRED LINE FOR VERCEL:
module.exports = app;