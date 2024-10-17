// Constants and global variables
const USERS_STORAGE_KEY = 'bus_booking_users';
const CURRENT_USER_KEY = 'bus_booking_current_user';
let currentUser = null;

// Replace with your actual Google Maps API key
const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';

// Add these variables at the top of your file
let map;
let directionsService;
let directionsRenderer;

// Initialize the application
document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
    setupNavigation();
    setupForms();
    populateCityOptions();
    setupMobileMenu();
    checkLoggedInUser();
    loadGoogleMapsScript();
}

function loadGoogleMapsScript() {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
}

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 20.5937, lng: 78.9629 }, // Center of India
        zoom: 5
    });
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    const fromInput = document.getElementById('searchFrom');
    const toInput = document.getElementById('searchTo');
    new google.maps.places.Autocomplete(fromInput);
    new google.maps.places.Autocomplete(toInput);
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
}

function switchTab(tabId) {
    const tabs = document.querySelectorAll('.tab-content');
    const navLinks = document.querySelectorAll('.nav-link');

    tabs.forEach(tab => tab.classList.remove('active'));
    navLinks.forEach(link => link.classList.remove('active'));

    const activeTab = document.getElementById(tabId);
    const activeLink = document.querySelector(`.nav-link[data-tab="${tabId}"]`);

    if (activeTab) activeTab.classList.add('active');
    if (activeLink) activeLink.classList.add('active');

    document.querySelector('nav ul').classList.remove('show');
}

function setupMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('nav ul');

    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('show');
    });
}

function setupForms() {
    const forms = {
        'register-form': handleRegister,
        'login-form': handleLogin,
        'booking-form': handleBooking,
        'check-booking-form': handleCheckBooking,
        'bus-search-form': handleBusSearch
    };

    Object.entries(forms).forEach(([formId, handler]) => {
        const form = document.getElementById(formId);
        if (form) form.addEventListener('submit', handler);
    });

    const loginWithOTPButton = document.getElementById('loginWithOTP');
    if (loginWithOTPButton) loginWithOTPButton.addEventListener('click', handleOTPLogin);
}

function populateCityOptions() {
    const cities = [
        'Mumbai', 'Delhi', 'Bangalore', 'Kolkata', 'Chennai', 'Hyderabad', 'Pune', 'Ahmedabad', 
        'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam'
    ];

    const citySelects = ['searchFrom', 'searchTo', 'bookingFrom', 'bookingTo'];
    citySelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Select a city</option>';
            cities.forEach(city => {
                select.innerHTML += `<option value="${city}">${city}</option>`;
            });
        }
    });
}

function checkLoggedInUser() {
    const storedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        updateUIForLoggedInUser();
    }
}

function handleRegister(e) {
    e.preventDefault();
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const address = document.getElementById('address').value;

    if (!validatePhone(phone)) {
        showMessage('Please enter a valid 10-digit phone number.', 'error');
        return;
    }

    const hashedPassword = btoa(password); // Simple encoding, not secure for production
    const newUser = { firstName, lastName, phone, password: hashedPassword, address };
    
    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
    
    if (users.some(user => user.phone === phone)) {
        showMessage('A user with this phone number already exists.', 'error');
        return;
    }
    
    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    
    showMessage('Registration successful! You can now log in.', 'success');
    e.target.reset();
}

function handleLogin(e) {
    e.preventDefault();
    const phone = document.getElementById('loginPhone').value;
    const password = document.getElementById('loginPassword').value;

    if (!validatePhone(phone)) {
        showMessage('Please enter a valid 10-digit phone number.', 'error');
        return;
    }

    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
    const user = users.find(u => u.phone === phone && u.password === btoa(password));

    if (user) {
        currentUser = {
            phone: user.phone,
            name: `${user.firstName} ${user.lastName}`,
            address: user.address
        };
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
        showMessage('Login successful!', 'success');
        updateUIForLoggedInUser();
    } else {
        showMessage('Invalid phone number or password', 'error');
    }
}

function handleOTPLogin() {
    const phone = prompt('Enter your phone number:');
    if (phone && validatePhone(phone)) {
        const otp = generateOTP();
        console.log('OTP sent to', phone, ':', otp);
        showMessage(`OTP sent to your phone: ${otp}`, 'success');
        
        const enteredOTP = prompt('Enter the OTP you received:');
        if (enteredOTP == otp) {
            const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
            const user = users.find(u => u.phone === phone);
            if (user) {
                currentUser = {
                    phone: user.phone,
                    name: `${user.firstName} ${user.lastName}`,
                    address: user.address
                };
                localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
                showMessage('OTP verified. Login successful!', 'success');
                updateUIForLoggedInUser();
            } else {
                showMessage('User not found. Please register first.', 'error');
            }
        } else {
            showMessage('Invalid OTP. Please try again.', 'error');
        }
    } else {
        showMessage('Please enter a valid 10-digit phone number.', 'error');
    }
}

function handleBooking(e) {
    e.preventDefault();
    if (!currentUser) {
        showMessage('Please log in to book a ticket', 'error');
        switchTab('login');
        return;
    }

    const from = document.getElementById('bookingFrom').value;
    const to = document.getElementById('bookingTo').value;
    const date = document.getElementById('bookingDate').value;
    const seats = document.getElementById('bookingSeats').value;

    const newBooking = { id: Date.now(), from, to, date, seats };
    
    const bookings = JSON.parse(localStorage.getItem(`bookings_${currentUser.phone}`) || '[]');
    
    bookings.push(newBooking);
    localStorage.setItem(`bookings_${currentUser.phone}`, JSON.stringify(bookings));

    showMessage('Booking successful!', 'success');
    updateUserDashboard();
    e.target.reset();
}

function handleCheckBooking(e) {
    e.preventDefault();
    const phone = document.getElementById('checkPhone').value;

    if (!validatePhone(phone)) {
        showMessage('Please enter a valid 10-digit phone number.', 'error');
        return;
    }

    const bookingDetails = getBookingDetails(phone);
    displayBookingDetails(bookingDetails);
}

function handleBusSearch(e) {
    e.preventDefault();
    const from = document.getElementById('searchFrom').value;
    const to = document.getElementById('searchTo').value;
    const date = document.getElementById('searchDate').value;

    // Show loading message
    const searchResults = document.getElementById('search-results');
    searchResults.innerHTML = '<p>Searching for buses...</p>';

    // Call the simulated bus search function
    simulateBusSearch(from, to, date)
        .then(buses => {
            displayBusResults(buses);
        })
        .catch(error => {
            console.error('Error searching for buses:', error);
            searchResults.innerHTML = '<p>An error occurred while searching for buses. Please try again.</p>';
        });
}

function simulateBusSearch(from, to, date) {
    // Simulate a delay to mimic an API call
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate a 20% chance of no buses found
            if (Math.random() < 0.2) {
                resolve([]);
            } else {
                const buses = [
                    {
                        name: "Express Bus 1",
                        departure: "08:00 AM",
                        arrival: "12:00 PM",
                        duration: "4 hours",
                        price: 500,
                        seats: 30
                    },
                    {
                        name: "Luxury Bus 2",
                        departure: "10:00 AM",
                        arrival: "02:30 PM",
                        duration: "4 hours 30 minutes",
                        price: 750,
                        seats: 25
                    },
                    {
                        name: "Night Bus 3",
                        departure: "11:00 PM",
                        arrival: "05:00 AM",
                        duration: "6 hours",
                        price: 600,
                        seats: 35
                    }
                ];
                resolve(buses);
            }
        }, 1000); // Simulate a 1-second delay
    });
}

function displayBusResults(buses) {
    const searchResults = document.getElementById('search-results');
    searchResults.innerHTML = '<h3>Search Results:</h3>';

    if (buses.length === 0) {
        searchResults.innerHTML += '<p>No buses found for the selected route and date.</p>';
    } else {
        buses.forEach((bus, index) => {
            const busElement = document.createElement('div');
            busElement.className = 'bus-result';
            busElement.innerHTML = `
                <h3>${bus.name}</h3>
                <p><strong>Departure:</strong> ${bus.departure}</p>
                <p><strong>Arrival:</strong> ${bus.arrival}</p>
                <p><strong>Duration:</strong> ${bus.duration}</p>
                <p><strong>Price:</strong> ₹${bus.price}</p>
                <p><strong>Available Seats:</strong> ${bus.seats}</p>
                <button class="book-now-btn" onclick="bookBus(${index})">Book Now</button>
            `;
            searchResults.appendChild(busElement);
        });
    }
}

function bookBus(busIndex) {
    if (!currentUser) {
        showMessage('Please log in to book a ticket', 'error');
        switchTab('login');
    } else {
        showMessage(`Booking bus ${busIndex + 1}. Implement actual booking logic.`, 'success');
        // Here you would typically open a booking form or modal with the selected bus details
    }
}

function updateUIForLoggedInUser() {
    document.querySelector('.nav-link[data-tab="login"]').style.display = 'none';
    document.querySelector('.nav-link[data-tab="register"]').style.display = 'none';
    
    const dashboardLink = document.createElement('li');
    dashboardLink.innerHTML = '<a href="#user-dashboard" class="nav-link" data-tab="user-dashboard">Dashboard</a>';
    document.querySelector('nav ul').appendChild(dashboardLink);

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) logoutButton.addEventListener('click', handleLogout);

    switchTab('user-dashboard');
    updateUserDashboard();
}

function updateUserDashboard() {
    const userInfo = document.getElementById('user-info');
    userInfo.innerHTML = `
        <p><strong>Name:</strong> ${currentUser.name}</p>
        <p><strong>Phone:</strong> ${maskPhoneNumber(currentUser.phone)}</p>
        <p><strong>Address:</strong> ${currentUser.address}</p>
    `;

    const userBookings = getBookingDetails(currentUser.phone);
    displayBookingDetails(userBookings);

    const favoriteRoutes = [
        { from: 'Mumbai', to: 'Pune' },
        { from: 'Delhi', to: 'Jaipur' }
    ];
    const favoriteRoutesDiv = document.getElementById('favorite-routes');
    favoriteRoutesDiv.innerHTML = favoriteRoutes.map(route => 
        `<p>${route.from} to ${route.to}</p>`
    ).join('');
}

function handleLogout() {
    localStorage.removeItem(CURRENT_USER_KEY);
    showMessage('Logged out successfully', 'success');
    location.reload();
}

function validatePhone(phone) {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
}

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000);
}

function getBookingDetails(phone) {
    return JSON.parse(localStorage.getItem(`bookings_${phone}`) || '[]');
}

function displayBookingDetails(bookings) {
    const bookingDetails = document.getElementById('booking-details') || document.getElementById('user-bookings');
    if (!bookingDetails) return;

    bookingDetails.innerHTML = '';

    if (bookings.length === 0) {
        bookingDetails.innerHTML = '<p>No bookings found.</p>';
    } else {
        const bookingsList = document.createElement('ul');
        bookings.forEach(booking => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                Booking ID: ${booking.id} - 
                From ${booking.from} to ${booking.to} on ${booking.date} - 
                ${booking.seats} seat(s)
                ${currentUser ? `<button onclick="cancelBooking(${booking.id})">Cancel</button>` : ''}
            `;
            bookingsList.appendChild(listItem);
        });
        bookingDetails.appendChild(bookingsList);
    }
}

function cancelBooking(bookingId) {
    let bookings = JSON.parse(localStorage.getItem(`bookings_${currentUser.phone}`) || '[]');
    bookings = bookings.filter(booking => booking.id !== bookingId);
    localStorage.setItem(`bookings_${currentUser.phone}`, JSON.stringify(bookings));
    showMessage('Booking cancelled successfully', 'success');
    updateUserDashboard();
}

function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.right = '20px';
    messageDiv.style.padding = '10px';
    messageDiv.style.borderRadius = '5px';
    messageDiv.style.backgroundColor = type === 'error' ? '#e74c3c' : '#2ecc71';
    messageDiv.style.color = '#fff';
    messageDiv.style.zIndex = '1000';
    document.body.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 3000);
}

function maskPhoneNumber(phone) {
    return phone.slice(0, 3) + 'XXXX' + phone.slice(7);
}
