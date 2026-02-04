var db = null;
var dbReady = false;
var isBrowserMode = false;
var browserDB = {}; // In-memory database for browser testing

document.addEventListener('deviceready', function() {
    console.log('Cordova deviceready event fired');
    initializeDatabase();
}, false);

// Initialize Database (works for both Cordova and Browser)
function initializeDatabase() {
    try {
        // Check if running on actual device (Cordova)
        if (window.sqlitePlugin) {
            console.log('Using Cordova SQLite Plugin');
            db = window.sqlitePlugin.openDatabase({
                name: 'builder_solution.db', 
                location: 'default', 
                androidDatabaseProvider: 'system'
            });
            isBrowserMode = false;
            createAllTables();
        } else {
            // Browser fallback mode
            console.log('sqlitePlugin not found - Using Browser Mode (In-Memory Database)');
            initializeBrowserDatabase();
            isBrowserMode = true;
        }
    } catch (error) {
        console.error('Database initialization error: ' + error.message);
        console.log('Falling back to Browser Mode');
        initializeBrowserDatabase();
        isBrowserMode = true;
    }
}

// Initialize in-memory database for browser testing
function initializeBrowserDatabase() {
    // Try to load existing database from localStorage
    const savedDB = localStorage.getItem('builderSolutionDB');
    
    if (savedDB) {
        try {
            browserDB = JSON.parse(savedDB);
            console.log('✓ Browser database loaded from localStorage');
        } catch (error) {
            console.error('Error loading database from localStorage:', error);
            // Fall back to default initialization
            initializeDefaultBrowserDB();
        }
    } else {
        // Initialize with default data if no saved data
        initializeDefaultBrowserDB();
    }
    
    dbReady = true;
    console.log('✓ Browser database ready');
    checkDatabaseStatus();
}

// Initialize default browser database
function initializeDefaultBrowserDB() {
    browserDB = {
        users: [
            { userId: 1, username: 'auditor', password: 'auditor123', email: 'auditor@buildersolution.com', phone: '0888000000', role: 'auditor', fullName: 'Auditor User', status: 'active', createdAt: new Date().toISOString(), lastLogin: null },
            { userId: 2, username: 'manager', password: 'manager123', email: 'manager@buildersolution.com', phone: '0888111111', role: 'manager', fullName: 'Manager User', status: 'active', createdAt: new Date().toISOString(), lastLogin: null },
            { userId: 3, username: 'staff', password: 'staff123', email: 'staff@buildersolution.com', phone: '0888222222', role: 'staff', fullName: 'Staff User', status: 'active', createdAt: new Date().toISOString(), lastLogin: null }
        ],
        products: [],
        orders: [],
        suppliers: [],
        payments: [],
        tokens: [],
        auditLog: [],
        customerFeedback: [],
        inventoryTransactions: [],
        staffPerformance: [],
        settings: []
    };
    
    // Save to localStorage
    saveBrowserDatabaseToStorage();
    console.log('✓ Browser database initialized with demo users');
}

// Save browser database to localStorage
function saveBrowserDatabaseToStorage() {
    try {
        localStorage.setItem('builderSolutionDB', JSON.stringify(browserDB));
        console.log('✓ Database saved to localStorage');
    } catch (error) {
        console.error('Error saving database to localStorage:', error);
        if (error.name === 'QuotaExceededError') {
            console.warn('⚠️ localStorage quota exceeded. Data may not persist.');
        }
    }
}

// Create all tables with proper schema and constraints (Cordova only)
function createAllTables() {
    if (!db) {
        console.error('Database object is null');
        return;
    }

    db.transaction(function(tx) {
        // Users Table
        tx.executeSql(`CREATE TABLE IF NOT EXISTS users (
            userId INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            email TEXT UNIQUE,
            phone TEXT,
            role TEXT CHECK(role IN ('admin', 'manager', 'staff', 'customer', 'auditor')) NOT NULL,
            fullName TEXT,
            status TEXT CHECK(status IN ('active', 'inactive', 'suspended')) DEFAULT 'active',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            lastLogin DATETIME
        )`, []);

        // Products Table
        tx.executeSql(`CREATE TABLE IF NOT EXISTS products (
            productId INTEGER PRIMARY KEY AUTOINCREMENT,
            productName TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL CHECK(price > 0),
            stock INTEGER NOT NULL CHECK(stock >= 0),
            lowStockThreshold INTEGER DEFAULT 50,
            unit TEXT,
            status TEXT CHECK(status IN ('active', 'inactive')) DEFAULT 'active',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, []);

        // Suppliers Table
        tx.executeSql(`CREATE TABLE IF NOT EXISTS suppliers (
            supplierId INTEGER PRIMARY KEY AUTOINCREMENT,
            supplierName TEXT NOT NULL,
            contactPerson TEXT,
            phone TEXT NOT NULL,
            email TEXT,
            address TEXT,
            city TEXT,
            productsSupplied TEXT,
            paymentTerms TEXT,
            status TEXT CHECK(status IN ('active', 'inactive')) DEFAULT 'active',
            rating REAL DEFAULT 0 CHECK(rating >= 0 AND rating <= 5),
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, []);

        // Orders Table
        tx.executeSql(`CREATE TABLE IF NOT EXISTS orders (
            orderId INTEGER PRIMARY KEY AUTOINCREMENT,
            orderNumber TEXT UNIQUE NOT NULL,
            customerId INTEGER,
            orderDate DATETIME DEFAULT CURRENT_TIMESTAMP,
            deliveryDate DATETIME,
            status TEXT CHECK(status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')) DEFAULT 'pending',
            totalAmount REAL NOT NULL CHECK(totalAmount >= 0),
            paymentStatus TEXT CHECK(paymentStatus IN ('unpaid', 'partial', 'paid')) DEFAULT 'unpaid',
            notes TEXT,
            FOREIGN KEY(customerId) REFERENCES users(userId)
        )`, []);

        // Order Items Table
        tx.executeSql(`CREATE TABLE IF NOT EXISTS orderItems (
            itemId INTEGER PRIMARY KEY AUTOINCREMENT,
            orderId INTEGER NOT NULL,
            productId INTEGER NOT NULL,
            quantity INTEGER NOT NULL CHECK(quantity > 0),
            unitPrice REAL NOT NULL CHECK(unitPrice > 0),
            subtotal REAL NOT NULL CHECK(subtotal > 0),
            FOREIGN KEY(orderId) REFERENCES orders(orderId),
            FOREIGN KEY(productId) REFERENCES products(productId)
        )`, []);

        // Inventory Transactions
        tx.executeSql(`CREATE TABLE IF NOT EXISTS inventoryTransactions (
            transactionId INTEGER PRIMARY KEY AUTOINCREMENT,
            productId INTEGER NOT NULL,
            transactionType TEXT CHECK(transactionType IN ('purchase', 'sale', 'adjustment', 'damage', 'return')) NOT NULL,
            quantity INTEGER NOT NULL,
            reason TEXT,
            staffId INTEGER,
            transactionDate DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(productId) REFERENCES products(productId),
            FOREIGN KEY(staffId) REFERENCES users(userId)
        )`, []);

        // Staff Performance Table
        tx.executeSql(`CREATE TABLE IF NOT EXISTS staffPerformance (
            performanceId INTEGER PRIMARY KEY AUTOINCREMENT,
            staffId INTEGER NOT NULL,
            salesCount INTEGER DEFAULT 0,
            totalSales REAL DEFAULT 0,
            customersServed INTEGER DEFAULT 0,
            rating REAL DEFAULT 0 CHECK(rating >= 0 AND rating <= 5),
            month TEXT,
            year INTEGER,
            evaluationNotes TEXT,
            FOREIGN KEY(staffId) REFERENCES users(userId)
        )`, []);

        // Customer Feedback Table
        tx.executeSql(`CREATE TABLE IF NOT EXISTS customerFeedback (
            feedbackId INTEGER PRIMARY KEY AUTOINCREMENT,
            customerId INTEGER NOT NULL,
            orderId INTEGER,
            rating REAL NOT NULL CHECK(rating >= 1 AND rating <= 5),
            comment TEXT,
            category TEXT CHECK(category IN ('product', 'service', 'delivery', 'price')) DEFAULT 'service',
            feedbackDate DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT CHECK(status IN ('new', 'reviewed', 'resolved')) DEFAULT 'new',
            FOREIGN KEY(customerId) REFERENCES users(userId),
            FOREIGN KEY(orderId) REFERENCES orders(orderId)
        )`, []);

        // Audit Log Table
        tx.executeSql(`CREATE TABLE IF NOT EXISTS auditLog (
            logId INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            action TEXT NOT NULL,
            entityType TEXT,
            entityId INTEGER,
            oldValue TEXT,
            newValue TEXT,
            ipAddress TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT CHECK(status IN ('success', 'failed')) DEFAULT 'success',
            FOREIGN KEY(userId) REFERENCES users(userId)
        )`, []);

        // Settings Table
        tx.executeSql(`CREATE TABLE IF NOT EXISTS settings (
            settingId INTEGER PRIMARY KEY AUTOINCREMENT,
            settingKey TEXT UNIQUE NOT NULL,
            settingValue TEXT,
            description TEXT,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, []);

        // Payments Table
        tx.executeSql(`CREATE TABLE IF NOT EXISTS payments (
            paymentId INTEGER PRIMARY KEY AUTOINCREMENT,
            orderId INTEGER NOT NULL,
            customerId INTEGER,
            paymentAmount REAL NOT NULL CHECK(paymentAmount > 0),
            paymentMethod TEXT CHECK(paymentMethod IN ('cash', 'card', 'bank_transfer', 'cheque','mobile')) NOT NULL,
            paymentDate DATETIME DEFAULT CURRENT_TIMESTAMP,
            referenceNumber TEXT,
            status TEXT CHECK(status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
            notes TEXT,
            FOREIGN KEY(orderId) REFERENCES orders(orderId),
            FOREIGN KEY(customerId) REFERENCES users(userId)
        )`, []);

        // Tokens Table
        tx.executeSql(`CREATE TABLE IF NOT EXISTS tokens (
            tokenId INTEGER PRIMARY KEY AUTOINCREMENT,
            orderId TEXT,
            tokenCode TEXT UNIQUE NOT NULL,
            generatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            sentSMS INTEGER DEFAULT 0,
            sentEmail INTEGER DEFAULT 0,
            redeemed INTEGER DEFAULT 0
        )`, []);

    }, handleTransactionError, handleTransactionSuccess);
}

function handleTransactionError(error) {
    console.error('✗ Database Transaction ERROR: ' + error.message);
}

function handleTransactionSuccess() {
    console.log('✓ All tables created successfully');
    dbReady = true;
    loadInitialData();
}

function loadInitialData() {
    if (isBrowserMode) return; // Browser mode already has demo data

    if (!db) return;

    db.transaction(function(tx) {
        tx.executeSql('SELECT COUNT(*) as count FROM users', [], function(tx, res) {
            const userCount = res.rows.item(0).count;
            if (userCount === 0) {
                console.log('Inserting demo users...');
                
                tx.executeSql('INSERT INTO users (username, password, email, phone, role, fullName, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    ['admin', 'admin123', 'admin@buildersolution.com', '0888000000', 'admin', 'Admin User', 'active'],
                    function() { console.log('✓ Admin inserted'); });
                
                tx.executeSql('INSERT INTO users (username, password, email, phone, role, fullName, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    ['manager', 'manager123', 'manager@buildersolution.com', '0888111111', 'manager', 'Manager User', 'active'],
                    function() { console.log('✓ Manager inserted'); });
                
                tx.executeSql('INSERT INTO users (username, password, email, phone, role, fullName, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    ['staff', 'staff123', 'staff@buildersolution.com', '0888222222', 'staff', 'Staff User', 'active'],
                    function() { console.log('✓ Staff inserted'); });
            } else {
                console.log('✓ Demo users already exist');
            }
        });
    });
}

// Browser mode query execution
function executeQueryBrowser(sql, params, successCallback, errorCallback) {
    try {
        if (sql.includes('SELECT')) {
            if (sql.includes('FROM users')) {
                let results = browserDB.users;
                
                if (sql.includes('WHERE username = ? AND password = ? AND status = ?')) {
                    results = results.filter(u => 
                        u.username === params[0] && u.password === params[1] && u.status === params[2]
                    );
                }
                if (sql.includes('WHERE username = ?')) {
                    results = results.filter(u => u.username === params[0]);
                }
                if (sql.includes('WHERE userId = ?')) {
                    results = results.filter(u => u.userId === params[0]);
                }
                if (sql.includes('COUNT(*)')) {
                    successCallback({ rows: { length: 1, item: (i) => ({ count: results.length }) } });
                    return;
                }
                
                successCallback({ rows: { length: results.length, item: (i) => results[i] } });
            }
        } else if (sql.includes('INSERT')) {
            if (sql.includes('users')) {
                const newId = Math.max(...browserDB.users.map(u => u.userId), 0) + 1;
                browserDB.users.push({
                    userId: newId,
                    username: params[0],
                    password: params[1],
                    email: params[2],
                    phone: params[3],
                    role: params[4],
                    fullName: params[5],
                    status: params[6],
                    createdAt: new Date().toISOString(),
                    lastLogin: null
                });
                successCallback({ insertId: newId });
            }
        } else if (sql.includes('UPDATE')) {
            successCallback({});
        }
    } catch (error) {
        if (errorCallback) errorCallback(error.message);
    }
}

// Execute query (handles both Cordova and Browser)
function executeQuery(sql, params, successCallback, errorCallback) {
    if (isBrowserMode) {
        executeQueryBrowser(sql, params, successCallback, errorCallback);
        return;
    }

    if (!db) {
        console.warn('Database not initialized, retrying...');
        setTimeout(() => executeQuery(sql, params, successCallback, errorCallback), 500);
        return;
    }

    db.transaction(function(tx) {
        tx.executeSql(sql, params, 
            function(tx, result) {
                if (successCallback) successCallback(result);
            },
            function(tx, error) {
                console.error('✗ Query error: ' + error.message);
                if (errorCallback) errorCallback(error.message);
                return true;
            }
        );
    });
}

// Check user credentials
function authenticateUser(username, password, callback) {
    if (!dbReady) {
        console.warn('Database not ready, retrying...');
        setTimeout(() => authenticateUser(username, password, callback), 500);
        return;
    }

    console.log(`Authenticating: ${username}`);

    if (isBrowserMode) {
        const user = browserDB.users.find(u => 
            u.username === username && u.password === password && u.status === 'active'
        );
        if (user) {
            console.log('✓ User authenticated:', user.username, user.role);
            callback(user);
        } else {
            console.log('✗ Authentication failed');
            callback(null);
        }
        return;
    }

    const sql = 'SELECT userId, username, role, fullName FROM users WHERE username = ? AND password = ? AND status = ?';
    executeQuery(sql, [username, password, 'active'],
        function(result) {
            if (result.rows.length > 0) {
                const user = result.rows.item(0);
                console.log('✓ User authenticated:', user.username);
                logAuditAction(user.userId, 'LOGIN', 'user', user.userId, null, null);
                callback(user);
            } else {
                console.log('✗ No user found');
                callback(null);
            }
        },
        function(error) {
            console.error('Authentication error:', error);
            callback(null);
        }
    );
}

// Register user (works in both modes)
function registerUser(userData, callback) {
    if (!dbReady) {
        console.warn('Database not ready, waiting...');
        setTimeout(() => registerUser(userData, callback), 1000);
        return;
    }

    console.log('Registering user:', userData.username);

    if (isBrowserMode) {
        // Check if user already exists
        if (browserDB.users.some(u => u.username === userData.username)) {
            if (callback) callback({ success: false, message: 'Username already exists' });
            return;
        }

        const newId = Math.max(...browserDB.users.map(u => u.userId), 0) + 1;
        browserDB.users.push({
            userId: newId,
            username: userData.username,
            password: userData.password,
            email: userData.email || null,
            phone: userData.phone || null,
            role: userData.role || 'customer',
            fullName: userData.fullName || userData.username,
            status: 'active',
            createdAt: new Date().toISOString(),
            lastLogin: null
        });
        
        // CRITICAL: Save to localStorage immediately
        saveBrowserDatabaseToStorage();
        
        console.log('✓ User registered:', userData.username);
        console.log('✓ Data saved to localStorage');
        if (callback) callback({ success: true, userId: newId });
        return;
    }

    const sql = 'INSERT INTO users (username, password, email, phone, role, fullName, status) VALUES (?, ?, ?, ?, ?, ?, ?)';
    executeQuery(sql, [
        userData.username,
        userData.password,
        userData.email || null,
        userData.phone || null,
        userData.role || 'customer',
        userData.fullName || userData.username,
        'active'
    ],
    function(result) {
        if (callback) callback({ success: true, userId: result.insertId });
    },
    function(error) {
        if (callback) callback({ success: false, message: error });
    });
}

// Validate input data
function validateInput(data, rules) {
    for (let field in rules) {
        const value = data[field];
        const rule = rules[field];

        if (rule.required && (!value || value.trim() === '')) {
            return { valid: false, message: `${field} is required` };
        }

        if (rule.type === 'email' && value && !isValidEmail(value)) {
            return { valid: false, message: `${field} must be a valid email` };
        }

        if (rule.type === 'phone' && value && !isValidPhone(value)) {
            return { valid: false, message: `${field} must be a valid phone number` };
        }

        if (rule.minLength && value && value.length < rule.minLength) {
            return { valid: false, message: `${field} must be at least ${rule.minLength} characters` };
        }

        if (rule.min && parseFloat(value) < rule.min) {
            return { valid: false, message: `${field} must be at least ${rule.min}` };
        }

        if (rule.maxLength && value && value.length > rule.maxLength) {
            return { valid: false, message: `${field} must be at most ${rule.maxLength} characters` };
        }
    }

    return { valid: true };
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Phone validation
function isValidPhone(phone) {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
}

// Get user by ID
function getUserById(userId, callback) {
    if (isBrowserMode) {
        const user = browserDB.users.find(u => u.userId === userId);
        callback(user || null);
        return;
    }

    const sql = 'SELECT userId, username, email, phone, role, fullName, status FROM users WHERE userId = ?';
    executeQuery(sql, [userId], function(result) {
        callback(result.rows.length > 0 ? result.rows.item(0) : null);
    });
}

// Log audit actions
function logAuditAction(userId, action, entityType, entityId, oldValue, newValue) {
    if (isBrowserMode) {
        browserDB.auditLog.push({
            logId: browserDB.auditLog.length + 1,
            userId, action, entityType, entityId, oldValue, newValue,
            timestamp: new Date().toISOString(),
            status: 'success'
        });
        return;
    }

    const sql = 'INSERT INTO auditLog (userId, action, entityType, entityId, oldValue, newValue, status) VALUES (?, ?, ?, ?, ?, ?, ?)';
    executeQuery(sql, [userId, action, entityType, entityId, oldValue, newValue, 'success']);
}

// Get products
function getProducts(callback) {
    if (isBrowserMode) {
        callback(browserDB.products);
        return;
    }

    const sql = 'SELECT * FROM products WHERE status = ? ORDER BY productName ASC';
    executeQuery(sql, ['active'],
        function(result) {
            const products = [];
            for (let i = 0; i < result.rows.length; i++) {
                products.push(result.rows.item(i));
            }
            callback(products);
        },
        function(error) {
            callback([]);
        }
    );
}

// Add product
function addProduct(product, callback) {
    if (isBrowserMode) {
        const newId = Math.max(...browserDB.products.map(p => p.productId || 0), 0) + 1;
        browserDB.products.push({
            productId: newId,
            productName: product.productName,
            category: product.category || 'General',
            description: product.description || '',
            price: product.price,
            stock: product.stock,
            lowStockThreshold: product.lowStockThreshold || 50,
            unit: product.unit || 'pcs',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        if (callback) callback({ success: true, productId: newId });
        return;
    }

    const sql = `INSERT INTO products (productName, category, description, price, stock, lowStockThreshold, unit, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    
    executeQuery(sql, [
        product.productName,
        product.category || 'General',
        product.description || '',
        product.price,
        product.stock,
        product.lowStockThreshold || 50,
        product.unit || 'pcs',
        'active'
    ],
    function(result) {
        if (callback) callback({ success: true, productId: result.insertId });
    },
    function(error) {
        if (callback) callback({ success: false, message: error });
    });
}

// Get orders
function getOrders(page = 1, limit = 10, callback) {
    if (isBrowserMode) {
        callback(browserDB.orders);
        return;
    }

    const offset = (page - 1) * limit;
    const sql = `SELECT * FROM orders ORDER BY orderDate DESC LIMIT ? OFFSET ?`;
    
    executeQuery(sql, [limit, offset],
        function(result) {
            const orders = [];
            for (let i = 0; i < result.rows.length; i++) {
                orders.push(result.rows.item(i));
            }
            callback(orders);
        },
        function(error) {
            callback([]);
        }
    );
}

// Record inventory transaction
function recordInventoryTransaction(productId, transactionType, quantity, staffId, reason, callback) {
    if (isBrowserMode) {
        const newId = browserDB.inventoryTransactions.length + 1;
        browserDB.inventoryTransactions.push({
            transactionId: newId, productId, transactionType, quantity, staffId, reason,
            transactionDate: new Date().toISOString()
        });
        if (callback) callback({ success: true, transactionId: newId });
        return;
    }

    const sql = `INSERT INTO inventoryTransactions (productId, transactionType, quantity, staffId, reason) VALUES (?, ?, ?, ?, ?)`;
    executeQuery(sql, [productId, transactionType, quantity, staffId, reason],
        function(result) {
            updateProductStock(productId, transactionType, quantity);
            if (callback) callback({ success: true, transactionId: result.insertId });
        },
        function(error) {
            if (callback) callback({ success: false, message: error });
        }
    );
}

// Update product stock
function updateProductStock(productId, transactionType, quantity) {
    let updateSql = '';
    
    switch(transactionType) {
        case 'purchase':
            updateSql = 'UPDATE products SET stock = stock + ? WHERE productId = ?';
            break;
        case 'sale':
        case 'damage':
            updateSql = 'UPDATE products SET stock = stock - ? WHERE productId = ?';
            break;
        case 'return':
            updateSql = 'UPDATE products SET stock = stock + ? WHERE productId = ?';
            break;
        default:
            return;
    }

    executeQuery(updateSql, [quantity, productId]);
}

// Get low stock products
function getLowStockProducts(callback) {
    if (isBrowserMode) {
        const lowStock = browserDB.products.filter(p => p.stock <= p.lowStockThreshold);
        callback(lowStock);
        return;
    }

    const sql = `SELECT * FROM products WHERE stock <= lowStockThreshold AND status = ? ORDER BY stock ASC`;
    executeQuery(sql, ['active'], function(result) {
        const products = [];
        for (let i = 0; i < result.rows.length; i++) {
            products.push(result.rows.item(i));
        }
        callback(products);
    });
}

// Save payment
function savePayment(orderId, customerId, amount, method, reference, status, notes, callback) {
    if (isBrowserMode) {
        const newId = browserDB.payments.length + 1;
        browserDB.payments.push({
            paymentId: newId,
            orderId, customerId, paymentAmount: amount, paymentMethod: method,
            referenceNumber: reference, status: status || 'completed',
            paymentDate: new Date().toISOString(), notes
        });
        if (callback) callback({ success: true, paymentId: newId });
        return;
    }

    const sql = 'INSERT INTO payments (orderId, customerId, paymentAmount, paymentMethod, referenceNumber, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)';
    executeQuery(sql, [orderId, customerId || null, amount, method, reference || null, status || 'completed', notes || null],
        function(result) {
            if (callback) callback({ success: true, paymentId: result.insertId });
        },
        function(error) {
            if (callback) callback({ success: false, message: error });
        }
    );
}

// Generate token
function generateToken(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < length; i++) token += chars.charAt(Math.floor(Math.random() * chars.length));
    return token;
}

// Save token
function saveToken(orderId, tokenCode, callback) {
    if (isBrowserMode) {
        const newId = browserDB.tokens.length + 1;
        browserDB.tokens.push({ 
            tokenId: newId, orderId, tokenCode, 
            generatedAt: new Date().toISOString(), 
            sentSMS: 0, sentEmail: 0, redeemed: 0 
        });
        if (callback) callback({ success: true, tokenId: newId });
        return;
    }

    const sql = 'INSERT INTO tokens (orderId, tokenCode, sentSMS, sentEmail, redeemed) VALUES (?, ?, ?, ?, ?)';
    executeQuery(sql, [orderId, tokenCode, 0, 0, 0],
        function(result) {
            if (callback) callback({ success: true, tokenId: result.insertId });
        },
        function(error) {
            if (callback) callback({ success: false, message: error });
        }
    );
}

// Send mock SMS
function sendMockSMS(phone, message) {
    console.log('MOCK SMS to', phone, message);
    return true;
}

// Send mock Email
function sendMockEmail(email, subject, body) {
    console.log('MOCK EMAIL to', email, subject, body);
    return true;
}

// Debug function
function checkDatabaseStatus() {
    console.log('=== DATABASE STATUS ===');
    console.log('Mode:', isBrowserMode ? 'BROWSER' : 'CORDOVA/ANDROID');
    console.log('DB Ready:', dbReady);
    if (isBrowserMode) {
        console.log('Total Users:', browserDB.users.length);
        console.log('Users:', browserDB.users.map(u => `${u.username} (${u.role})`));
    }
}

window.checkDatabaseStatus = checkDatabaseStatus;

// ========== PASSWORD RESET FUNCTIONS ==========

// Find user by username or email
function findUserByUsernameOrEmail(usernameOrEmail, callback) {
    if (!dbReady) {
        console.warn('Database not ready, retrying...');
        setTimeout(() => findUserByUsernameOrEmail(usernameOrEmail, callback), 500);
        return;
    }

    console.log(`Finding user: ${usernameOrEmail}`);

    if (isBrowserMode) {
        const user = browserDB.users.find(u => 
            (u.username === usernameOrEmail || u.email === usernameOrEmail) && u.status === 'active'
        );
        if (user) {
            console.log('✓ User found:', user.username);
            callback(user);
        } else {
            console.log('✗ User not found');
            callback(null);
        }
        return;
    }

    const sql = 'SELECT userId, username, email, fullName FROM users WHERE (username = ? OR email = ?) AND status = ?';
    executeQuery(sql, [usernameOrEmail, usernameOrEmail, 'active'],
        function(result) {
            if (result.rows.length > 0) {
                const user = result.rows.item(0);
                console.log('✓ User found:', user.username);
                callback(user);
            } else {
                console.log('✗ No user found');
                callback(null);
            }
        },
        function(error) {
            console.error('Error finding user:', error);
            callback(null);
        }
    );
}

// Check if username already exists
function checkUsernameExists(username, callback) {
    if (!dbReady) {
        console.warn('Database not ready, retrying...');
        setTimeout(() => checkUsernameExists(username, callback), 500);
        return;
    }

    console.log(`Checking username: ${username}`);

    if (isBrowserMode) {
        const exists = browserDB.users.some(u => u.username === username);
        console.log(`Username "${username}" exists: ${exists}`);
        callback(exists);
        return;
    }

    const sql = 'SELECT COUNT(*) as count FROM users WHERE username = ?';
    executeQuery(sql, [username],
        function(result) {
            const exists = result.rows.item(0).count > 0;
            console.log(`Username "${username}" exists: ${exists}`);
            callback(exists);
        },
        function(error) {
            console.error('Error checking username:', error);
            callback(false);
        }
    );
}

// Update user password
function updateUserPassword(username, newPassword, callback) {
    if (!dbReady) {
        console.warn('Database not ready, retrying...');
        setTimeout(() => updateUserPassword(username, newPassword, callback), 500);
        return;
    }

    console.log(`Updating password for: ${username}`);

    if (isBrowserMode) {
        const user = browserDB.users.find(u => u.username === username);
        if (user) {
            user.password = newPassword;
            
            // CRITICAL: Save to localStorage immediately
            saveBrowserDatabaseToStorage();
            
            console.log('✓ Password updated for:', username);
            console.log('✓ Data saved to localStorage');
            logAuditAction(user.userId, 'PASSWORD_RESET', 'user', user.userId, null, null);
            callback(true);
        } else {
            console.log('✗ User not found for password update');
            callback(false);
        }
        return;
    }

    const sql = 'UPDATE users SET password = ? WHERE username = ?';
    executeQuery(sql, [newPassword, username],
        function(result) {
            console.log('✓ Password updated successfully');
            callback(true);
        },
        function(error) {
            console.error('Error updating password:', error);
            callback(false);
        }
    );
}

// Auto-initialize on document ready if no deviceready
document.addEventListener('DOMContentLoaded', function() {
    if (!dbReady && !isBrowserMode && !db) {
        console.log('Forcing browser mode initialization...');
        setTimeout(initializeDatabase, 100);
    }
});