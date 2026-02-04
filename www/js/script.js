// Global Variables
let currentUser = null;
let cart = [];
let products = [];
let orders = [];
let suppliers = [];
let saleItems = [];

// Initialize App - jQuery Version
$(document).ready(function() {
    setTimeout(() => {
        $('#loadingScreen').fadeOut(300, function() {
            showScreen('loginScreen');
        });
    }, 1500);

    initializeData();
    setupEventListeners();
});

// Initialize Sample Data
function initializeData() {
    // Sample Products
    products = [
        { id: 1, name: 'Cement 50kg', category: 'cement', price: 45000, stock: 200, lowStock: 50, icon: '🏗️' },
        { id: 2, name: 'Red Bricks', category: 'bricks', price: 350, stock: 5000, lowStock: 1000, icon: '🧱' },
        { id: 3, name: 'Roofing Sheets', category: 'roofing', price: 25000, stock: 150, lowStock: 30, icon: '🏠' },
        { id: 4, name: 'Timber 4x2', category: 'timber', price: 8000, stock: 80, lowStock: 20, icon: '🪵' },
        { id: 5, name: 'White Paint 20L', category: 'paint', price: 35000, stock: 45, lowStock: 10, icon: '🎨' },
        { id: 6, name: 'Hammer', category: 'tools', price: 15000, stock: 30, lowStock: 5, icon: '🔨' },
        { id: 7, name: 'Nails 1kg', category: 'tools', price: 5000, stock: 100, lowStock: 20, icon: '📌' },
        { id: 8, name: 'Sand per trip', category: 'cement', price: 80000, stock: 25, lowStock: 5, icon: '⛱️' }
    ];

    // Sample Suppliers
    suppliers = [
        { id: 1, name: 'ABC Building Supplies', contact: 'John Banda', phone: '+265 888 123 456', email: 'abc@suppliers.com', products: 'Cement, Bricks' },
        { id: 2, name: 'Quality Roofing Ltd', contact: 'Mary Phiri', phone: '+265 999 234 567', email: 'quality@roofing.com', products: 'Roofing Sheets' },
        { id: 3, name: 'Timber Traders', contact: 'Peter Mwale', phone: '+265 888 345 678', email: 'timber@traders.com', products: 'Timber, Wood' }
    ];

    // Sample Orders (past)
    orders = [
        { id: 'ORD001', customerId: 1, items: [{ productId: 1, quantity: 2 }], total: 90000, status: 'completed', token: 'ABC12345', date: new Date().toISOString() }
    ];
}

// Setup Event Listeners - jQuery Version
function setupEventListeners() {
    // Login Form
    $(document).on('submit', '#loginForm', handleLogin);

    // Register Form
    $(document).on('submit', '#registerForm', handleRegister);

    // Show Register Screen
    $(document).on('click', '#showRegister', (e) => {
        e.preventDefault();
        showScreen('registerScreen');
    });

    // Back to Login
    $(document).on('click', '#backToLogin', () => {
        showScreen('loginScreen');
    });

    // Add Product Form
    $(document).on('submit', '#addProductForm', handleAddProduct);

    // Search Products
    $(document).on('input', '#searchProducts', searchProducts);
    $(document).on('input', '#searchSaleProducts', searchSaleProducts);
}

// Screen Management - jQuery Version
function showScreen(screenId) {
    $('.screen').removeClass('active');
    $('#' + screenId).addClass('active');

    // Load screen-specific data
    switch(screenId) {
        case 'customerDashboard':
            loadCustomerDashboard();
            break;
        case 'browseProducts':
            loadProducts();
            break;
        case 'myCart':
            loadCart();
            break;
        case 'myOrders':
            loadCustomerOrders();
            break;
        case 'staffDashboard':
            loadStaffDashboard();
            break;
        case 'processSale':
            loadSaleProducts();
            break;
        case 'managerDashboard':
            loadManagerDashboard();
            break;
        case 'inventoryManagement':
            loadInventory();
            break;
        case 'suppliers':
            loadSuppliers();
            break;
        case 'auditorDashboard':
            loadAuditorDashboard();
            break;
    }
}

// Authentication - jQuery Version
function handleLogin(e) {
    e.preventDefault();
    const username = $('#loginUsername').val();
    const password = $('#loginPassword').val();
    const role = $('#loginRole').val();

    // Simple validation (in production, this would be server-side)
    if (username && password && role) {
        currentUser = {
            id: Date.now(),
            username: username,
            role: role,
            name: username.charAt(0).toUpperCase() + username.slice(1)
        };

        showToast('Login successful!', 'success');

        // Redirect based on role
        switch(role) {
            case 'customer':
                showScreen('customerDashboard');
                break;
            case 'staff':
                showScreen('staffDashboard');
                break;
            case 'manager':
                showScreen('managerDashboard');
                break;
            case 'auditor':
                showScreen('auditorDashboard');
                break;
        }

        $('#loginForm')[0].reset();
    } else {
        showToast('Please fill all fields', 'error');
    }
}

function handleRegister(e) {
    e.preventDefault();
    const name = $('#regName').val();
    const email = $('#regEmail').val();
    const phone = $('#regPhone').val();
    const username = $('#regUsername').val();
    const password = $('#regPassword').val();

    // In production, this would save to database
    showToast('Registration successful! Please login.', 'success');
    showScreen('loginScreen');
    $('#registerForm')[0].reset();
}

function logout() {
    currentUser = null;
    cart = [];
    saleItems = [];
    showToast('Logged out successfully', 'success');
    showScreen('loginScreen');
}

// Customer Functions - jQuery Version
function loadCustomerDashboard() {
    $('#customerName').text(currentUser.name);
    updateCartCount();
}

function loadProducts() {
    const $grid = $('#productsGrid');
    $grid.empty();

    products.forEach(product => {
        const $card = $('<div>')
            .addClass('product-card')
            .html(`
                <div class="product-image">${product.icon}</div>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">MWK ${product.price.toLocaleString()}</div>
                    <div class="product-stock">${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</div>
                    <button class="btn-add-cart" onclick="addToCart(${product.id})" ${product.stock === 0 ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                </div>
            `);
        $grid.append($card);
    });
}

function searchProducts(e) {
    const searchTerm = $(e.target).val().toLowerCase();
    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm) || 
        p.category.toLowerCase().includes(searchTerm)
    );

    const $grid = $('#productsGrid');
    $grid.empty();

    filtered.forEach(product => {
        const $card = $('<div>')
            .addClass('product-card')
            .html(`
                <div class="product-image">${product.icon}</div>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">MWK ${product.price.toLocaleString()}</div>
                    <div class="product-stock">${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</div>
                    <button class="btn-add-cart" onclick="addToCart(${product.id})" ${product.stock === 0 ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                </div>
            `);
        $grid.append($card);
    });
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.productId === productId);

    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity++;
            showToast('Quantity updated', 'success');
        } else {
            showToast('Not enough stock', 'warning');
            return;
        }
    } else {
        cart.push({
            productId: productId,
            name: product.name,
            price: product.price,
            quantity: 1,
            icon: product.icon
        });
        showToast('Added to cart', 'success');
    }

    updateCartCount();
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    $('#cartCount').text(count);
    $('#cartCountHeader').text(count);
}

function loadCart() {
    const $container = $('#cartItems');
    $container.empty();

    if (cart.length === 0) {
        $container.html('<p style="text-align:center; padding:40px; color:#6b7280;">Your cart is empty</p>');
        $('#cartSubtotal').text('MWK 0');
        $('#cartTotal').text('MWK 0');
        return;
    }

    cart.forEach((item, index) => {
        const $itemDiv = $('<div>')
            .addClass('cart-item')
            .html(`
                <div style="display:flex; align-items:center; gap:15px;">
                    <div style="font-size:30px;">${item.icon}</div>
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>MWK ${item.price.toLocaleString()} × ${item.quantity}</p>
                    </div>
                </div>
                <div class="cart-item-controls">
                    <div class="qty-control">
                        <button class="qty-btn" onclick="updateCartQty(${index}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="updateCartQty(${index}, 1)">+</button>
                    </div>
                    <button class="btn-remove" onclick="removeFromCart(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `);
        $container.append($itemDiv);
    });

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    $('#cartSubtotal').text(`MWK ${total.toLocaleString()}`);
    $('#cartTotal').text(`MWK ${total.toLocaleString()}`);
}

function updateCartQty(index, change) {
    const item = cart[index];
    const product = products.find(p => p.id === item.productId);
    
    const newQty = item.quantity + change;
    
    if (newQty <= 0) {
        removeFromCart(index);
        return;
    }
    
    if (newQty > product.stock) {
        showToast('Not enough stock', 'warning');
        return;
    }
    
    cart[index].quantity = newQty;
    loadCart();
    updateCartCount();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    loadCart();
    updateCartCount();
    showToast('Item removed', 'success');
}

function proceedToCheckout() {
    if (cart.length === 0) {
        showToast('Cart is empty', 'warning');
        return;
    }
    showScreen('checkout');
    loadCheckout();
}

function loadCheckout() {
    const $summary = $('#checkoutSummary');
    $summary.empty();

    cart.forEach(item => {
        const $div = $('<div>')
            .addClass('order-item')
            .html(`
                <span>${item.name} × ${item.quantity}</span>
                <span>MWK ${(item.price * item.quantity).toLocaleString()}</span>
            `);
        $summary.append($div);
    });

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    $('#checkoutTotal').text(`MWK ${total.toLocaleString()}`);
}

let selectedPaymentMethod = null;

function selectPayment(method) {
    selectedPaymentMethod = method;
    $('.payment-option').removeClass('selected');
    $(event.target).closest('.payment-option').addClass('selected');
    $('#paymentDetails').show();
}

function completePayment() {
    if (!selectedPaymentMethod) {
        showToast('Please select payment method', 'warning');
        return;
    }

    const phone = $('#paymentPhone').val();
    if (!phone) {
        showToast('Please enter phone number', 'warning');
        return;
    }

    // Generate unique token
    const token = generateToken();
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create order
    const order = {
        id: 'ORD' + Date.now(),
        customerId: currentUser.id,
        items: [...cart],
        total: total,
        status: 'paid',
        token: token,
        paymentMethod: selectedPaymentMethod,
        phone: phone,
        date: new Date().toISOString()
    };

    orders.push(order);

    // Update stock
    cart.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            product.stock -= item.quantity;
        }
    });

    // Clear cart
    cart = [];
    updateCartCount();

    // Show success
    showToast(`Payment successful! Your token is: ${token}`, 'success');
    
    // Show token details
    alert(`Payment Successful!\n\nYour Payment Token: ${token}\n\nPlease present this token at the shop to collect your items.\n\nToken expires in 14 days.\n\nAn SMS has been sent to ${phone}`);

    showScreen('customerDashboard');
}

function generateToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < 8; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

function loadCustomerOrders() {
    // This would load customer's order history
    showToast('Order history loaded', 'success');
}

// Staff Functions - jQuery Version
function loadStaffDashboard() {
    $('#staffName').text(currentUser.name);
}

function verifyTokenCode() {
    const tokenInput = $('#tokenInput').val().trim().toUpperCase();
    
    if (tokenInput.length !== 8) {
        showToast('Token must be 8 characters', 'warning');
        return;
    }

    const order = orders.find(o => o.token === tokenInput);
    const $resultDiv = $('#tokenResult');

    if (order) {
        $resultDiv.removeClass('token-error').addClass('token-success');
        $resultDiv.html(`
            <h3 style="color: var(--success-color); margin-bottom:15px;">
                <i class="fas fa-check-circle"></i> Valid Token
            </h3>
            <div class="order-details">
                <div class="order-detail-item">
                    <strong>Order ID:</strong>
                    <span>${order.id}</span>
                </div>
                <div class="order-detail-item">
                    <strong>Total Amount:</strong>
                    <span>MWK ${order.total.toLocaleString()}</span>
                </div>
                <div class="order-detail-item">
                    <strong>Status:</strong>
                    <span class="text-success">${order.status}</span>
                </div>
                <div class="order-detail-item">
                    <strong>Payment Method:</strong>
                    <span>${order.paymentMethod}</span>
                </div>
            </div>
            <h4 style="margin-top:15px; margin-bottom:10px;">Items:</h4>
            ${order.items.map(item => `
                <div class="order-detail-item">
                    <span>${item.name} × ${item.quantity}</span>
                    <span>MWK ${(item.price * item.quantity).toLocaleString()}</span>
                </div>
            `).join('')}
            <button class="btn btn-primary btn-block btn-release" onclick="releaseOrder('${order.id}')">
                <i class="fas fa-check"></i> Release Goods
            </button>
        `);
    } else {
        $resultDiv.removeClass('token-success').addClass('token-error');
        $resultDiv.html(`
            <h3 style="color: var(--danger-color);">
                <i class="fas fa-times-circle"></i> Invalid Token
            </h3>
            <p style="margin-top:10px; color:var(--text-secondary);">
                Token not found or already used. Please check and try again.
            </p>
        `);
    }
}

function releaseOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order.status = 'completed';
        
        // jQuery animations for instant UI update
        const $resultDiv = $('#tokenResult');
        $resultDiv.fadeOut(200, function() {
            $(this).html(`
                <div style="padding:20px; background:var(--success-color); color:white; border-radius:8px;">
                    <h3><i class="fas fa-check-circle"></i> Goods Released Successfully!</h3>
                    <p>Order marked as completed. Ready for next verification.</p>
                </div>
            `).fadeIn(300);
        });
        
        $('#tokenInput').val('').focus();
        showToast('Goods released successfully', 'success');
    }
}

function loadSaleProducts() {
    const $list = $('#saleProductsList');
    $list.empty();

    products.forEach(product => {
        if (product.stock > 0) {
            const $item = $('<div>')
                .addClass('product-list-item')
                .html(`
                    <div>
                        <div style="font-size:14px; font-weight:600;">${product.name}</div>
                        <div style="font-size:12px; color:var(--text-secondary);">MWK ${product.price.toLocaleString()}</div>
                    </div>
                    <button class="btn-add-cart" onclick="addToSale(${product.id})">
                        <i class="fas fa-plus"></i>
                    </button>
                `);
            $list.append($item);
        }
    });
}

function searchSaleProducts(e) {
    const searchTerm = $(e.target).val().toLowerCase();
    const filtered = products.filter(p => 
        (p.name.toLowerCase().includes(searchTerm) || 
        p.category.toLowerCase().includes(searchTerm)) &&
        p.stock > 0
    );

    const $list = $('#saleProductsList');
    $list.empty();

    filtered.forEach(product => {
        const $item = $('<div>')
            .addClass('product-list-item')
            .html(`
                <div>
                    <div style="font-size:14px; font-weight:600;">${product.name}</div>
                    <div style="font-size:12px; color:var(--text-secondary);">MWK ${product.price.toLocaleString()}</div>
                </div>
                <button class="btn-add-cart" onclick="addToSale(${product.id})">
                    <i class="fas fa-plus"></i>
                </button>
            `);
        $list.append($item);
    });
}

function addToSale(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = saleItems.find(item => item.productId === productId);

    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity++;
        } else {
            showToast('Not enough stock', 'warning');
            return;
        }
    } else {
        saleItems.push({
            productId: productId,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }

    loadSaleItems();
}

function loadSaleItems() {
    const $container = $('#saleItems');
    $container.empty();

    saleItems.forEach((item, index) => {
        const $div = $('<div>')
            .addClass('order-detail-item')
            .html(`
                <div>
                    <div>${item.name}</div>
                    <div style="font-size:12px; color:var(--text-secondary);">Qty: ${item.quantity}</div>
                </div>
                <div>
                    <div>MWK ${(item.price * item.quantity).toLocaleString()}</div>
                    <button class="btn-remove" style="font-size:12px; padding:4px 8px; margin-top:5px;" onclick="removeSaleItem(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `);
        $container.append($div);
    });

    const total = saleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    $('#saleTotal').text(`MWK ${total.toLocaleString()}`);
}

function removeSaleItem(index) {
    saleItems.splice(index, 1);
    loadSaleItems();
}

function completeSale() {
    if (saleItems.length === 0) {
        showToast('No items in sale', 'warning');
        return;
    }

    const paymentMethod = $('#salePaymentMethod').val();
    const total = saleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Update stock
    saleItems.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            product.stock -= item.quantity;
        }
    });

    // Create sale record
    const sale = {
        id: 'SALE' + Date.now(),
        staffId: currentUser.id,
        items: [...saleItems],
        total: total,
        paymentMethod: paymentMethod,
        date: new Date().toISOString()
    };

    showToast(`Sale completed! Total: MWK ${total.toLocaleString()}`, 'success');
    
    // Reset sale
    saleItems = [];
    loadSaleItems();
    loadSaleProducts();
}

function showScreen(screen) {
    document.getElementById('stockCheck').addEventListener('click', () => {
        loadInventory();
        showScreen('inventoryManagement');
    });
}

// Manager Functions - jQuery Version
function loadManagerDashboard() {
    $('#managerName').text(currentUser.name);

    // Calculate stats
    const todayOrders = orders.filter(o => {
        const orderDate = new Date(o.date);
        const today = new Date();
        return orderDate.toDateString() === today.toDateString();
    });

    const todaySales = todayOrders.reduce((sum, o) => sum + o.total, 0);
    $('#todaySales').text(`MWK ${todaySales.toLocaleString()}`);
    $('#totalOrders').text(todayOrders.length);

    const lowStockCount = products.filter(p => p.stock <= p.lowStock).length;
    $('#lowStock').text(lowStockCount);
}

function loadInventory() {
    filterInventory('all');
}

function filterInventory(filter) {
    const $list = $('#inventoryList');
    $list.empty();

    // Update active tab
    $('.tab').removeClass('active');
    $(event?.target).addClass('active');

    let filtered = products;
    if (filter === 'low') {
        filtered = products.filter(p => p.stock <= p.lowStock && p.stock > 0);
    } else if (filter === 'out') {
        filtered = products.filter(p => p.stock === 0);
    }

    filtered.forEach(product => {
        let stockClass = 'good';
        let stockText = 'Good Stock';
        if (product.stock === 0) {
            stockClass = 'out';
            stockText = 'Out of Stock';
        } else if (product.stock <= product.lowStock) {
            stockClass = 'low';
            stockText = 'Low Stock';
        }

        const $item = $('<div>')
            .addClass('inventory-item')
            .html(`
                <div class="inventory-item-header">
                    <h4>${product.icon} ${product.name}</h4>
                    <span class="stock-badge ${stockClass}">${stockText}</span>
                </div>
                <div class="inventory-item-details">
                    <div><strong>Category:</strong> ${product.category}</div>
                    <div><strong>Price:</strong> MWK ${product.price.toLocaleString()}</div>
                    <div><strong>Stock:</strong> ${product.stock} units</div>
                    <div><strong>Low Alert:</strong> ${product.lowStock} units</div>
                </div>
                <button class="btn-update-stock" onclick="updateStock(${product.id})">
                    <i class="fas fa-edit"></i> Update Stock
                </button>
            `);
        $list.append($item);
    });

    if (filtered.length === 0) {
        $list.html('<p style="text-align:center; padding:40px; color:#6b7280;">No items found</p>');
    }
}

function updateStock(productId) {
    const product = products.find(p => p.id === productId);
    const newStock = prompt(`Update stock for ${product.name}\nCurrent: ${product.stock}`, product.stock);
    
    if (newStock !== null && !isNaN(newStock) && newStock >= 0) {
        product.stock = parseInt(newStock);
        showToast('Stock updated successfully', 'success');
        loadInventory();
    }
}

function showAddProduct() {
    $('#addProductModal').addClass('active');
}

function handleAddProduct(e) {
    e.preventDefault();
    
    const newProduct = {
        id: products.length + 1,
        name: $('#productName').val(),
        category: $('#productCategory').val(),
        price: parseInt($('#productPrice').val()),
        stock: parseInt($('#productStock').val()),
        lowStock: parseInt($('#productLowStock').val()),
        icon: '📦'
    };

    products.push(newProduct);
    showToast('Product added successfully', 'success');
    closeModal('addProductModal');
    $('#addProductForm')[0].reset();
    loadInventory();
}

function loadSuppliers() {
    const $list = $('#suppliersList');
    $list.empty();

    suppliers.forEach(supplier => {
        const $card = $('<div>')
            .addClass('supplier-card')
            .html(`
                <h3><i class="fas fa-truck"></i> ${supplier.name}</h3>
                <div class="supplier-info">
                    <div class="supplier-info-item">
                        <i class="fas fa-user"></i>
                        <span>${supplier.contact}</span>
                    </div>
                    <div class="supplier-info-item">
                        <i class="fas fa-phone"></i>
                        <span>${supplier.phone}</span>
                    </div>
                    <div class="supplier-info-item">
                        <i class="fas fa-envelope"></i>
                        <span>${supplier.email}</span>
                    </div>
                    <div class="supplier-info-item">
                        <i class="fas fa-box"></i>
                        <span>${supplier.products}</span>
                    </div>
                </div>
                <div class="supplier-actions">
                    <button class="btn-call" onclick="callSupplier('${supplier.phone}')">
                        <i class="fas fa-phone"></i> Call
                    </button>
                    <button class="btn-sms" onclick="smsSupplier('${supplier.phone}')">
                        <i class="fas fa-sms"></i> SMS
                    </button>
                </div>
            `);
        $list.append($card);
    });
}

function showAddSupplier() {
    const name = prompt('Supplier Name:');
    if (!name) return;
    
    const contact = prompt('Contact Person:');
    if (!contact) return;
    
    const phone = prompt('Phone Number:');
    if (!phone) return;
    
    const email = prompt('Email:');
    if (!email) return;
    
    const productsSupplied = prompt('Products Supplied:');
    if (!productsSupplied) return;

    suppliers.push({
        id: suppliers.length + 1,
        name: name,
        contact: contact,
        phone: phone,
        email: email,
        products: productsSupplied
    });

    showToast('Supplier added successfully', 'success');
    loadSuppliers();
}

function callSupplier(phone) {
    showToast(`Calling ${phone}...`, 'success');
    // In production: window.location.href = `tel:${phone}`;
}

function smsSupplier(phone) {
    const message = prompt('Enter message to send:');
    if (message) {
        showToast(`SMS sent to ${phone}`, 'success');
        // In production: window.location.href = `sms:${phone}?body=${encodeURIComponent(message)}`;
    }
}

// Auditor Functions
function loadAuditorDashboard() {
    document.getElementById('auditorName').textContent = currentUser.name;
}

function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const reportDate = document.getElementById('reportDate').value;
    const output = document.getElementById('reportOutput');

    output.innerHTML = `
        <h3>${reportType.toUpperCase()} REPORT</h3>
        <p style="color:var(--text-secondary); margin-bottom:20px;">Date: ${reportDate || 'All Time'}</p>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Payment Method</th>
                    <th>Amount</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${orders.map(order => `
                    <tr>
                        <td>${order.id}</td>
                        <td>${new Date(order.date).toLocaleDateString()}</td>
                        <td>${order.paymentMethod || 'Cash'}</td>
                        <td>MWK ${order.total.toLocaleString()}</td>
                        <td><span class="text-success">${order.status}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div style="margin-top:20px; padding-top:20px; border-top:2px solid var(--border);">
            <div style="display:flex; justify-content:space-between; font-size:18px; font-weight:bold;">
                <span>TOTAL SALES:</span>
                <span class="text-success">MWK ${orders.reduce((sum, o) => sum + o.total, 0).toLocaleString()}</span>
            </div>
        </div>
        <button class="btn btn-primary" style="margin-top:20px;" onclick="exportReport()">
            <i class="fas fa-download"></i> Export to PDF
        </button>
    `;
}

function exportReport() {
    showToast('Report exported successfully', 'success');
    // In production, this would generate actual PDF
}

// Modal Functions
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Utility Functions
function formatCurrency(amount) {
    return `MWK ${amount.toLocaleString()}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MW', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Initialize sample data on load
console.log('Builder\'s Solution System Initialized');
console.log('Sample Credentials:');
console.log('Customer: username=customer, password=test123, role=customer');
console.log('Staff: username=staff, password=test123, role=staff');
console.log('Manager: username=manager, password=test123, role=manager');
console.log('Auditor: username=auditor, password=test123, role=auditor');