document.addEventListener('DOMContentLoaded', function() {
    
    // ==========================================
    // 1. NAVIGATION LOGIC
    // ==========================================
    const navButtons = document.querySelectorAll('nav button');
    const formSections = document.querySelectorAll('.form-section');

    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Highlight active button
            navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Show correct form
            const targetId = this.id.replace('Btn', 'Form');
            formSections.forEach(form => {
                form.classList.remove('active');
                if (form.id === targetId) {
                    form.classList.add('active');
                }
            });

            // Hide any open data tables when switching tabs
            document.querySelectorAll('.data-section').forEach(section => {
                section.style.display = 'none';
            });
        });
    });

    // ==========================================
    // 2. PHONE NUMBER INPUT MANAGEMENT
    // ==========================================
    const addPhoneBtn = document.getElementById('addPhoneBtn');
    const phoneInputs = document.getElementById('phoneInputs');

    if (addPhoneBtn) {
        addPhoneBtn.addEventListener('click', function() {
            const phoneInputDiv = document.createElement('div');
            phoneInputDiv.className = 'phone-input';
            phoneInputDiv.innerHTML = `
              <input type="tel" placeholder="Enter phone number" required />
              <button type="button" class="remove-phone-btn">×</button>
            `;
            phoneInputs.appendChild(phoneInputDiv);

            if (phoneInputs.children.length > 1) {
                document.querySelectorAll('.remove-phone-btn').forEach(btn => {
                    btn.disabled = false;
                });
            }
        });
    }

    if (phoneInputs) {
        phoneInputs.addEventListener('click', function(e) {
            if (e.target.classList.contains('remove-phone-btn') && !e.target.disabled) {
                e.target.parentElement.remove();
                if (phoneInputs.children.length === 1) {
                    document.querySelector('.remove-phone-btn').disabled = true;
                }
            }
        });
    }

    // ==========================================
    // 3. UTILITY FUNCTIONS
    // ==========================================
    function showSuccessMessage(message) {
        const successMessage = document.getElementById('successMessage');
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 5000);
    }

    window.closeDataSection = function(sectionId) {
        document.getElementById(sectionId).style.display = 'none';
    };

    const API_BASE = 'https://blood-donation-38rx.vercel.app';  // Central API URL

    // ==========================================
    // 4. FORM SUBMISSIONS (ADDING DATA)
    // ==========================================
    
    // Add Donor
    document.getElementById('addDonorForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const phoneInputsList = document.querySelectorAll('#phoneInputs input');
        const phoneNumbers = Array.from(phoneInputsList).map(input => input.value);

        const data = {
            name: document.getElementById('name').value,
            gender: document.getElementById('gender').value,
            dob: document.getElementById('dob').value,
            blood_type: document.getElementById('blood_type').value,
            phone_numbers: phoneNumbers
        };

        try {
            const res = await fetch(`${API_BASE}/add-donor`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const result = await res.json();
            showSuccessMessage(`Donor registered successfully with ID: ${result.donorId}`);
            this.reset();
            phoneInputsList.forEach((input, index) => {
                if (index > 0) input.parentElement.remove();
            });
            phoneInputsList[0].value = '';
        } catch (error) {
            alert('Error registering donor: ' + error.message);
        }
    });

    // Add Donation
    document.getElementById('addDonationForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const data = {
            donor_id: document.getElementById('donor_id').value,
            date: document.getElementById('donation_date').value,
            quantity: document.getElementById('quantity').value,
            location: document.getElementById('location').value
        };
        try {
            const res = await fetch(`${API_BASE}/add-donation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const result = await res.json();
            showSuccessMessage(`Donation recorded successfully with ID: ${result.donationId}`);
            this.reset();
        } catch (error) {
            alert('Error recording donation: ' + error.message);
        }
    });

    // Add Blood Bank
    document.getElementById('addBloodBankForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const data = {
            name: document.getElementById('bank_name').value,
            location: document.getElementById('bank_location').value,
            capacity: document.getElementById('capacity').value,
            contact: document.getElementById('bank_contact').value
        };
        try {
            const res = await fetch(`${API_BASE}/add-blood-bank`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const result = await res.json();
            showSuccessMessage(`Blood bank added successfully with ID: ${result.bankId}`);
            this.reset();
        } catch (error) {
            alert('Error adding blood bank: ' + error.message);
        }
    });

    // Add Hospital
    document.getElementById('addHospitalForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const data = {
            name: document.getElementById('hospital_name').value,
            location: document.getElementById('hospital_location').value,
            contact: document.getElementById('hospital_contact').value
        };
        try {
            const res = await fetch(`${API_BASE}/add-hospital`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const result = await res.json();
            showSuccessMessage(`Hospital added successfully with ID: ${result.hospitalId}`);
            this.reset();
        } catch (error) {
            alert('Error adding hospital: ' + error.message);
        }
    });

    // Add Request
    document.getElementById('addRequestForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const data = {
            hospital_id: document.getElementById('hospital_id').value,
            bank_id: document.getElementById('bank_id').value,
            blood_type: document.getElementById('request_blood_type').value,
            quantity: document.getElementById('request_quantity').value,
            urgency: document.getElementById('urgency').value,
            date: document.getElementById('request_date').value
        };
        try {
            const res = await fetch(`${API_BASE}/add-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const result = await res.json();
            showSuccessMessage(`Blood request submitted successfully with ID: ${result.requestId}`);
            this.reset();
        } catch (error) {
            alert('Error submitting blood request: ' + error.message);
        }
    });

    // ==========================================
    // 5. DATA LOADING & VIEWING
    // ==========================================
    
    // Master function for all "View All" AND Search results!
    async function loadSectionData(endpoint, tableId, containerId, rowTemplate) {
        try {
            const res = await fetch(`${API_BASE}${endpoint}`);
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

            const data = await res.json();
            const tbody = document.querySelector(`#${tableId} tbody`);
            tbody.innerHTML = '';

            if (!data || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 15px; color: red;">No records found.</td></tr>`;
            } else {
                data.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = rowTemplate(item);
                    tbody.appendChild(row);
                });
            }

            const container = document.getElementById(containerId);
            container.style.display = 'block';
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (error) {
            console.error(`Error loading ${endpoint}:`, error);
            alert(`Could not load data. Check if server is running.`);
        }
    }

    // View All Donors
    document.getElementById('viewDonorsBtn').addEventListener('click', () => {
        loadSectionData('/donors-with-phones', 'donorTable', 'donorDataSection', (item) => `
            <td>${item.Donor_ID}</td>
            <td>${item.Name || 'Unknown'}</td>
            <td>${item.Gender || 'N/A'}</td>
            <td>${item.Date_of_Birth ? new Date(item.Date_of_Birth).toLocaleDateString() : 'N/A'}</td>
            <td><strong style="color: #e74c3c;">${item.Blood_Type || 'N/A'}</strong></td>
            <td>${item.Phone_Numbers && item.Phone_Numbers.length > 0 ? item.Phone_Numbers.join(', ') : 'None'}</td>
        `);
    });

    // View All Donations
    document.getElementById('viewDonationsBtn').addEventListener('click', () => {
        loadSectionData('/donations', 'donationTable', 'donationDataSection', (item) => `
            <td>${item.Donation_ID}</td>
            <td>${item.Donor_ID}</td>
            <td>${item.Date ? new Date(item.Date).toLocaleDateString() : 'N/A'}</td>
            <td>${item.Quantity}</td>
            <td>${item.Location}</td>
        `);
    });

    // View All Blood Banks
    document.getElementById('viewBloodBanksBtn').addEventListener('click', () => {
        loadSectionData('/blood-banks', 'bloodBankTable', 'bloodBankDataSection', (item) => `
            <td>${item.Bank_ID}</td>
            <td>${item.Name}</td>
            <td>${item.Location}</td>
            <td>${item.Capacity}</td>
            <td>${item.Contact_Number}</td>
        `);
    });

    // View All Hospitals
    document.getElementById('viewHospitalsBtn').addEventListener('click', () => {
        loadSectionData('/hospitals', 'hospitalTable', 'hospitalDataSection', (item) => `
            <td>${item.Hospital_ID}</td>
            <td>${item.Name}</td>
            <td>${item.Location}</td>
            <td>${item.Contact_Number}</td>
        `);
    });

    // View All Requests
    document.getElementById('viewRequestsBtn').addEventListener('click', () => {
        loadSectionData('/requests', 'requestTable', 'requestDataSection', (item) => `
            <td>${item.Request_ID}</td>
            <td>${item.Hospital_ID}</td>
            <td>${item.Bank_ID}</td>
            <td>${item.Blood_Type_Required}</td>
            <td>${item.Quantity_Required}</td>
            <td>${item.Urgency_Level}</td>
            <td>${item.Request_Date ? new Date(item.Request_Date).toLocaleDateString() : 'N/A'}</td>
        `);
    });

    // ==========================================
    // 6. UNIVERSAL SEARCH LOGIC
    // ==========================================
    
    // Reusable function to attach search logic to ANY input and button
    function setupSearch(inputId, btnId, endpointPrefix, tableId, containerId, rowTemplate) {
        const searchInput = document.getElementById(inputId);
        const searchBtn = document.getElementById(btnId);

        if (!searchInput || !searchBtn) return; // Skip if it can't find the HTML elements

        const performSpecificSearch = () => {
            const query = searchInput.value.trim();
            if (!query) {
                alert('Please enter a search term!');
                return;
            }
            // Passes the search query to your Master loadSectionData function
            loadSectionData(`${endpointPrefix}?q=${encodeURIComponent(query)}`, tableId, containerId, rowTemplate);
        };

        // Fire on Button Click
        searchBtn.addEventListener('click', performSpecificSearch);

        // Fire on Enter Key
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSpecificSearch();
            }
        });
    }

    // Attach Search to Donors
    setupSearch('searchInput', 'searchDonorBtn', '/search-donors', 'donorTable', 'donorDataSection', (item) => `
        <td>${item.Donor_ID}</td>
        <td>${item.Name || 'Unknown'}</td>
        <td>${item.Gender || 'N/A'}</td>
        <td>${item.Date_of_Birth ? new Date(item.Date_of_Birth).toLocaleDateString() : 'N/A'}</td>
        <td><strong style="color: #e74c3c;">${item.Blood_Type || 'N/A'}</strong></td>
        <td>${item.Phone_Numbers && item.Phone_Numbers.length > 0 ? item.Phone_Numbers.join(', ') : 'None'}</td>
    `);

    // Attach Search to Donations
    setupSearch('searchDonationInput', 'searchDonationBtn', '/search-donations', 'donationTable', 'donationDataSection', (item) => `
        <td>${item.Donation_ID}</td>
        <td>${item.Donor_ID}</td>
        <td>${item.Date ? new Date(item.Date).toLocaleDateString() : 'N/A'}</td>
        <td>${item.Quantity}</td>
        <td>${item.Location}</td>
    `);

    // Attach Search to Blood Banks
    setupSearch('searchBloodBankInput', 'searchBloodBankBtn', '/search-blood-banks', 'bloodBankTable', 'bloodBankDataSection', (item) => `
        <td>${item.Bank_ID}</td>
        <td>${item.Name}</td>
        <td>${item.Location}</td>
        <td>${item.Capacity}</td>
        <td>${item.Contact_Number}</td>
    `);

    // Attach Search to Hospitals
    setupSearch('searchHospitalInput', 'searchHospitalBtn', '/search-hospitals', 'hospitalTable', 'hospitalDataSection', (item) => `
        <td>${item.Hospital_ID}</td>
        <td>${item.Name}</td>
        <td>${item.Location}</td>
        <td>${item.Contact_Number}</td>
    `);

    // Attach Search to Requests
    setupSearch('searchRequestInput', 'searchRequestBtn', '/search-requests', 'requestTable', 'requestDataSection', (item) => `
        <td>${item.Request_ID}</td>
        <td>${item.Hospital_ID}</td>
        <td>${item.Bank_ID}</td>
        <td>${item.Blood_Type_Required}</td>
        <td>${item.Quantity_Required}</td>
        <td>${item.Urgency_Level}</td>
        <td>${item.Request_Date ? new Date(item.Request_Date).toLocaleDateString() : 'N/A'}</td>
    `);

}); // END OF DOMContentLoaded