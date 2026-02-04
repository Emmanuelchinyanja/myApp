// Login and Registration JavaScript - Full jQuery Implementation

// Hide loading screen after page loads
$(window).on('load', function() {
    setTimeout(() => {
        $('#loadingScreen').hide();
    }, 1500);
});

// Login Form Handler - NO ROLE SELECTION
$(document).ready(function() {
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        
        const username = $('#loginUsername').val().trim();
        const password = $('#loginPassword').val();

        if (!username || !password) {
            showToast('Please fill all fields', 'warning');
            return;
        }

        // Use SQLite authentication if available
        if (typeof authenticateUser === 'function') {
            authenticateUser(username, password, function(user) {
                if (user) {
                    // Role is automatically determined from database user role
                    const userData = {
                        id: user.userId,
                        username: user.username,
                        role: user.role, // Get role from database (auditor, manager, staff, customer)
                        name: user.fullName || user.username,
                        loginTime: new Date().toISOString()
                    };
                    
                    console.log('✓ User authenticated:', userData.username, 'Role:', userData.role);
                    sessionStorage.setItem('currentUser', JSON.stringify(userData));
                    showToast(`Login successful! Welcome ${userData.name}`, 'success');
                    
                    // Route to appropriate dashboard based on role from database
                    setTimeout(() => {
                        switch(userData.role) {
                            case 'customer': 
                                window.location.href = 'customer_dashboard.html'; 
                                break;
                            case 'staff': 
                                window.location.href = 'staff_dashboard.html'; 
                                break;
                            case 'manager': 
                                window.location.href = 'manager_dashboard.html'; 
                                break;
                            case 'auditor': 
                                window.location.href = 'auditor_dashboard.html'; 
                                break;
                            default: 
                                window.location.href = 'customer_dashboard.html';
                        }
                    }, 700);
                } else {
                    showToast('❌ Invalid username or password', 'error');
                    console.log('✗ Authentication failed for user:', username);
                }
            });
        } else {
            showToast('⚠️ Database not ready. Please refresh and try again.', 'warning');
            console.warn('authenticateUser function not available');
        }
    });
});

// Show Register Screen - jQuery
$('#showRegister').on('click', function(e) {
    e.preventDefault();
    $('#loginScreen').removeClass('active');
    $('#registerScreen').addClass('active');
});

// Back to Login - jQuery
$('#backToLogin').on('click', function() {
    $('#registerScreen').removeClass('active');
    $('#loginScreen').addClass('active');
});

// Forgot password link -> show reset screen
$('#forgotPasswordLink').on('click', function(e) {
    e.preventDefault();
    $('#loginScreen').removeClass('active');
    $('#passwordResetScreen').addClass('active');
    // ensure first step visible
    $('#resetStep1').show();
    $('#resetStep2').hide();
    $('#resetStep3').hide();
});

// Back from reset
$('#backFromReset').on('click', function() {
    $('#passwordResetScreen').removeClass('active');
    $('#loginScreen').addClass('active');
});

// Helper: generate 6-digit code
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store reset requests in localStorage under key 'passwordResetRequests'
function saveResetRequest(request) {
    const key = 'passwordResetRequests';
    let arr = localStorage.getItem(key);
    arr = arr ? JSON.parse(arr) : [];
    arr.push(request);
    localStorage.setItem(key, JSON.stringify(arr));
}

function findResetRequestByUsername(username) {
    const key = 'passwordResetRequests';
    let arr = localStorage.getItem(key);
    arr = arr ? JSON.parse(arr) : [];
    return arr.reverse().find(r => r.username === username) || null;
}

let _currentResetUsername = null;

// Step 1: Request code
$('#resetRequestForm').on('submit', function(e) {
    e.preventDefault();
    const usernameOrEmail = $('#resetUsername').val().trim();
    if (!usernameOrEmail) { showToast('Enter username or email', 'warning'); return; }

    if (typeof findUserByUsernameOrEmail === 'function') {
        findUserByUsernameOrEmail(usernameOrEmail, function(user) {
            if (!user) {
                showToast('No active account found with that username/email', 'error');
                return;
            }

            // generate code and save request
            const code = generateVerificationCode();
            const expiry = Date.now() + (10 * 60 * 1000); // 10 minutes
            const request = { username: user.username, email: user.email || null, code: code, expiry: expiry };
            saveResetRequest(request);
            _currentResetUsername = user.username;

            // send mock email if function available
            if (typeof sendMockEmail === 'function' && user.email) {
                sendMockEmail(user.email, 'Password Reset Code', `Your verification code is: ${code}`);
            }

            showToast('Verification code sent (mock). Check your email.', 'success');
            $('#resetStep1').hide();
            $('#resetStep2').show();
        });
    } else {
        showToast('Password reset unavailable - database not ready', 'warning');
    }
});

// Resend code button
$('#resendCodeBtn').on('click', function() {
    if (!_currentResetUsername) { showToast('Start reset process first', 'warning'); return; }
    if (typeof findUserByUsernameOrEmail === 'function') {
        findUserByUsernameOrEmail(_currentResetUsername, function(user) {
            if (!user) { showToast('User not found', 'error'); return; }
            const code = generateVerificationCode();
            const expiry = Date.now() + (10 * 60 * 1000);
            const request = { username: user.username, email: user.email || null, code: code, expiry: expiry };
            saveResetRequest(request);
            if (typeof sendMockEmail === 'function' && user.email) {
                sendMockEmail(user.email, 'Password Reset Code - Resend', `Your verification code is: ${code}`);
            }
            showToast('Verification code resent (mock).', 'success');
        });
    }
});

// Step 2: Verify code
$('#resetCodeForm').on('submit', function(e) {
    e.preventDefault();
    const code = $('#resetCode').val().trim();
    if (!code) { showToast('Enter verification code', 'warning'); return; }

    // find latest request for this username
    const key = 'passwordResetRequests';
    let arr = localStorage.getItem(key);
    arr = arr ? JSON.parse(arr) : [];

    // find a request that matches code and not expired
    const req = arr.reverse().find(r => r.code === code && r.expiry > Date.now());
    if (!req) { showToast('Invalid or expired code', 'error'); return; }

    _currentResetUsername = req.username;
    $('#resetStep2').hide();
    $('#resetStep3').show();
    showToast('Code verified. Enter new password.', 'success');
});

// Step 3: Update password
$('#resetPasswordForm').on('submit', function(e) {
    e.preventDefault();
    const newPass = $('#newPassword').val();
    const confirmPass = $('#confirmPassword').val();
    if (!newPass || !confirmPass) { showToast('Fill both password fields', 'warning'); return; }
    if (newPass !== confirmPass) { showToast('Passwords do not match', 'warning'); return; }
    if (!_currentResetUsername) { showToast('No reset in progress', 'error'); return; }

    if (typeof updateUserPassword === 'function') {
        updateUserPassword(_currentResetUsername, newPass, function(success) {
            if (success) {
                showToast('Password updated successfully. Please login.', 'success');
                // clear state
                _currentResetUsername = null;
                $('#resetPasswordForm')[0].reset();
                $('#passwordResetScreen').removeClass('active');
                $('#loginScreen').addClass('active');
            } else {
                showToast('Failed to update password', 'error');
            }
        });
    } else {
        showToast('Unable to update password - database not ready', 'warning');
    }
});

// Register Form Handler - CUSTOMERS ONLY - jQuery Implementation
$(document).ready(function() {
    $('#registerForm').on('submit', function(e) {
        e.preventDefault();
        
        const name = $('#regName').val().trim();
        const email = $('#regEmail').val().trim();
        const phone = $('#regPhone').val().trim();
        const username = $('#regUsername').val().trim();
        const password = $('#regPassword').val();

        if (!username || !password || !name) {
            showToast('Please fill all required fields', 'warning');
            return;
        }

        if (typeof registerUser === 'function') {
            // Register as customer only
            registerUser({ 
                username: username, 
                password: password, 
                email: email, 
                phone: phone, 
                fullName: name, 
                role: 'customer' // Always register as customer
            }, function(res) {
                if (res && res.success) {
                    showToast('✓ Registration successful! Please login.', 'success');
                    setTimeout(() => {
                        $('#registerScreen').removeClass('active');
                        $('#loginScreen').addClass('active');
                        $('#registerForm').trigger('reset');
                        $('#loginUsername').focus();
                    }, 700);
                } else {
                    showToast('❌ Registration failed. Username may already exist.', 'error');
                }
            });
        } else {
            showToast('⚠️ Database not ready', 'warning');
        }
    });
});

// jQuery Toast Notification System
function showToast(message, type = 'success') {
    const $toast = $('#toast');
    if ($toast.length) {
        $toast.text(message);
        $toast.removeClass('success warning error')
              .addClass(type)
              .addClass('show');
        
        setTimeout(() => {
            $toast.removeClass('show');
        }, 3000);
    }
}