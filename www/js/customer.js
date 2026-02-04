// Customer Dashboard JavaScript - Full jQuery Implementation

let currentUser = null;
let cart = [];
let products = [];
let orders = [];

// Check if user is logged in
$(window).on('load', function() {
    const userData = sessionStorage.getItem('currentUser');
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = JSON.parse(userData);
    if (currentUser.role !== 'customer') {
        window.location.href = 'index.html';
        return;
    }
    
    initializeData();
    loadCustomerDashboard();
});

// Initialize Sample Data
function initializeData() {
    // Load from localStorage or use default
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
        products = JSON.parse(savedProducts);
    } else {
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
        localStorage.setItem('products', JSON.stringify(products));
    }

    // Load orders
    const savedOrders = localStorage.getItem('orders');
    if (savedOrders) {
        orders = JSON.parse(savedOrders);
    }

    // Load cart for current user
    const savedCart = localStorage.getItem(`cart_${currentUser.id}`);
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

// Screen Management
function showSection(sectionId) {
    $('.screen').removeClass('active');
    $('#' + sectionId).addClass('active');

    // Load section-specific data
    switch(sectionId) {
        case 'browseProducts':
            loadProducts();
            break;
        case 'myCart':
            loadCart();
            break;
        case 'myOrders':
            loadOrders();
            break;
    }
}

function loadCustomerDashboard() {
    $('#customerName').text(currentUser.name);
    updateCartCount();
}

function loadProducts() {
    const grid = $('#productsGrid');
    grid.html('');

    products.forEach(product => {
        const card = $('<div>')
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
        grid.append(card);
    });
}

// Search Products
$(document).ready(function() {
    $('#searchProducts').on('input', function(e) {
        const searchTerm = $(this).val().toLowerCase();
        const filtered = products.filter(p => 
            p.name.toLowerCase().includes(searchTerm) || 
            p.category.toLowerCase().includes(searchTerm)
        );

        const grid = $('#productsGrid');
        grid.html('');

        filtered.forEach(product => {
            const card = $('<div>')
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
            grid.append(card);
        });
    });
});

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

    localStorage.setItem(`cart_${currentUser.id}`, JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    $('#cartCount').text(count);
    $('#cartCountHeader').text(count);
}

function loadCart() {
    const container = $('#cartItems');
    container.html('');

    if (cart.length === 0) {
        container.html('<p style="text-align:center; padding:40px; color:#6b7280;">Your cart is empty</p>');
        $('#cartSubtotal').text('MWK 0');
        $('#cartTotal').text('MWK 0');
        return;
    }

    cart.forEach((item, index) => {
        const itemDiv = $('<div>')
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
        container.append(itemDiv);
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
    localStorage.setItem(`cart_${currentUser.id}`, JSON.stringify(cart));
    loadCart();
    updateCartCount();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem(`cart_${currentUser.id}`, JSON.stringify(cart));
    loadCart();
    updateCartCount();
    showToast('Item removed', 'success');
}

function proceedToCheckout() {
    if (cart.length === 0) {
        showToast('Cart is empty', 'warning');
        return;
    }
    showSection('checkout');
    loadCheckout();
}

function loadCheckout() {
    const summary = $('#checkoutSummary');
    summary.html('');

    cart.forEach(item => {
        const div = $('<div>')
            .addClass('order-item')
            .html(`
                <span>${item.name} × ${item.quantity}</span>
                <span>MWK ${(item.price * item.quantity).toLocaleString()}</span>
            `);
        summary.append(div);
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
        customerName: currentUser.name,
        items: [...cart],
        total: total,
        status: 'paid',
        token: token,
        paymentMethod: selectedPaymentMethod,
        phone: phone,
        date: new Date().toISOString()
    };

    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));

    // Create staff notification so shop staff know items were bought online
    try {
        let notes = localStorage.getItem('notifications');
        notes = notes ? JSON.parse(notes) : [];
        const notif = {
            id: 'NOT' + Date.now(),
            orderId: order.id,
            customerId: currentUser.id,
            customerName: currentUser.name,
            token: order.token,
            items: order.items,
            total: order.total,
            status: 'not_verified', // staff must verify when customer collects
            date: new Date().toISOString()
        };
        notes.push(notif);
        localStorage.setItem('notifications', JSON.stringify(notes));
    } catch (e) {
        console.error('Failed to create notification', e);
    }

    // Update stock
    cart.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            product.stock -= item.quantity;
        }
    });
    localStorage.setItem('products', JSON.stringify(products));

    // Clear cart
    cart = [];
    localStorage.setItem(`cart_${currentUser.id}`, JSON.stringify(cart));
    updateCartCount();

    // Show success
    alert(`Payment Successful!\n\nYour Payment Token: ${token}\n\nPlease present this token at the shop to collect your items.\n\nToken expires in 14 days.\n\nAn SMS has been sent to ${phone}`);

    showToast(`Payment successful! Your token is: ${token}`, 'success');
    showSection('customerDashboard');
}

function generateToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < 8; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

function loadOrders() {
    const container = $('#ordersList');
    const userOrders = orders.filter(o => o.customerId === currentUser.id);
    
    if (userOrders.length === 0) {
        container.html('<div class="welcome-card"><p style="text-align:center;">No orders yet</p></div>');
        return;
    }

    container.html('');
    userOrders.reverse().forEach(order => {
        const card = $('<div>')
            .addClass('welcome-card')
            .html(`
                <h4>${order.id}</h4>
                <p><strong>Token:</strong> ${order.token}</p>
                <p><strong>Total:</strong> MWK ${order.total.toLocaleString()}</p>
                <p><strong>Status:</strong> <span class="text-success">${order.status}</span></p>
                <p><strong>Date:</strong> ${new Date(order.date).toLocaleString()}</p>
            `);
        container.append(card);
    });
}

// Quotation Form
$(document).ready(function() {
    $('#quotationForm').on('submit', function(e) {
        e.preventDefault();
        
        const quotation = {
            id: 'QT' + Date.now(),
            customerId: currentUser.id,
            customerName: currentUser.name,
            description: $('#quotationDescription').val(),
            budget: $('#quotationBudget').val(),
            phone: $('#quotationPhone').val(),
            status: 'pending',
            date: new Date().toISOString()
        };
        
        let quotations = localStorage.getItem('quotations');
        quotations = quotations ? JSON.parse(quotations) : [];
        quotations.push(quotation);
        localStorage.setItem('quotations', JSON.stringify(quotations));
        
        showToast('Quotation request submitted successfully!', 'success');
        this.reset();
        loadQuotations();
    });
});

function loadQuotations() {
    const container = $('#quotationsList');
    let quotations = localStorage.getItem('quotations');
    quotations = quotations ? JSON.parse(quotations) : [];
    
    const userQuotations = quotations.filter(q => q.customerId === currentUser.id);
    
    if (userQuotations.length === 0) {
        container.html('');
        return;
    }
    
    container.html('<h3 style="margin-bottom:15px;">My Quotation Requests</h3>');
    userQuotations.reverse().forEach(quotation => {
        const card = $('<div>')
            .addClass('welcome-card')
            .html(`
                <h4>${quotation.id}</h4>
                <p><strong>Status:</strong> <span class="text-${quotation.status === 'pending' ? 'warning' : 'success'}">${quotation.status}</span></p>
                <p><strong>Budget:</strong> MWK ${parseInt(quotation.budget).toLocaleString()}</p>
                <p><strong>Date:</strong> ${new Date(quotation.date).toLocaleDateString()}</p>
            `);
        container.append(card);
    });
}

// Feedback Form
$(document).ready(function() {
    $('#feedbackForm').on('submit', function(e) {
        e.preventDefault();
        
        const feedback = {
            id: 'FB' + Date.now(),
            customerId: currentUser.id,
            customerName: currentUser.name,
            rating: $('#feedbackRating').val(),
            comment: $('#feedbackComment').val(),
            date: new Date().toISOString()
        };
        
        let feedbacks = localStorage.getItem('feedbacks');
        feedbacks = feedbacks ? JSON.parse(feedbacks) : [];
        feedbacks.push(feedback);
        localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
        
        showToast('Feedback submitted successfully!', 'success');
        this.reset();
        loadFeedbackHistory();
    });
});

function loadFeedbackHistory() {
    const container = $('#feedbackHistory');
    let feedbacks = localStorage.getItem('feedbacks');
    feedbacks = feedbacks ? JSON.parse(feedbacks) : [];
    
    const userFeedbacks = feedbacks.filter(f => f.customerId === currentUser.id);
    
    if (userFeedbacks.length === 0) {
        container.html('');
        return;
    }
    
    container.html('<h3 style="margin-bottom:15px;">My Previous Feedback</h3>');
    userFeedbacks.reverse().forEach(feedback => {
        const card = $('<div>')
            .addClass('welcome-card');
        const stars = '⭐'.repeat(parseInt(feedback.rating));
        card.html(`
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span>${stars}</span>
                <span style="font-size:12px; color:var(--text-secondary);">${new Date(feedback.date).toLocaleDateString()}</span>
            </div>
            <p style="margin-top:10px;">${feedback.comment}</p>
        `);
        container.append(card);
    });
}

function logout() {
    sessionStorage.removeItem('currentUser');
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

function showToast(message, type = 'success') {
    const toast = $('#toast');
    toast.text(message)
        .removeClass('success error warning info')
        .addClass(type)
        .addClass('show');
    
    setTimeout(() => {
        toast.removeClass('show');
    }, 3000);
}