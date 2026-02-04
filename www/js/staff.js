// Staff Dashboard JavaScript - Full jQuery Implementation

let currentUser = null;
let products = [];
let orders = [];
let saleItems = [];
let notifications = [];

// Check if user is logged in
$(window).on('load', function() {
    const userData = sessionStorage.getItem('currentUser');
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = JSON.parse(userData);
    if (currentUser.role !== 'staff') {
        window.location.href = 'index.html';
        return;
    }
    
    initializeData();
    loadStaffDashboard();
});

// Initialize Data
function initializeData() {
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

    const savedOrders = localStorage.getItem('orders');
    if (savedOrders) {
        orders = JSON.parse(savedOrders);
    }

    const savedNotes = localStorage.getItem('notifications');
    if (savedNotes) {
        notifications = JSON.parse(savedNotes);
    }
}

// Reload products from localStorage to stay in sync with other clients
function refreshProductsFromStorage() {
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
        try {
            products = JSON.parse(savedProducts);
        } catch (e) {
            console.error('Failed to parse products from storage', e);
        }
    }
}

// Screen Management
function showSection(sectionId) {
    // Using jQuery for DOM selection and manipulation
    $('.screen').removeClass('active');
    $('#' + sectionId).addClass('active');

    switch(sectionId) {
        case 'processSale':
            refreshProductsFromStorage();
            loadSaleProducts();
            break;
        case 'stockCheck':
            refreshProductsFromStorage();
            filterStock('all');
            break;
        case 'notifications':
            loadNotifications();
            break;
    }
}

function loadStaffDashboard() {
    // ensure latest product stock is loaded
    refreshProductsFromStorage();
    $('#staffName').text(currentUser.name);
    
    // Calculate today's stats
    const today = new Date().toDateString();
    const todaySales = orders.filter(o => {
        return o.staffId === currentUser.id && 
               new Date(o.date).toDateString() === today;
    });
    
    const todayAmount = todaySales.reduce((sum, o) => sum + o.total, 0);
    const verifiedCount = orders.filter(o => o.releasedBy === currentUser.name).length;
    
    $('#todaySalesCount').text(todaySales.length);
    $('#todaySalesAmount').text(`MWK ${todayAmount.toLocaleString()}`);
    $('#verifiedTokens').text(verifiedCount);

    // Notification badge (unverified online orders)
    const unverified = notifications.filter(n => n.status === 'not_verified').length;
    if (unverified > 0) {
        $('#notifBadge').text(unverified).show();
    } else {
        $('#notifBadge').hide();
    }
}

// Reset All Figures to Zero
function resetAllSalesData() {
    if (!confirm('⚠️ Are you sure you want to reset ALL sales data to zero?\n\nThis will clear:\n- All orders\n- All sales figures\n- All tokens\n\nThis action cannot be undone!')) {
        return;
    }
    
    // Clear all data
    orders = [];
    saleItems = [];
    
    // Clear localStorage
    localStorage.removeItem('orders');
    localStorage.removeItem('quotations');
    localStorage.removeItem('feedbacks');
    
    // Reset dashboard figures to zero
    $('#todaySalesCount').text('0');
    $('#todaySalesAmount').text('MWK 0');
    $('#verifiedTokens').text('0');
    $('#tokenInput').val('');
    $('#tokenResult').html('');
    
    console.log('✓ All sales data reset to zero by ' + currentUser.name);
    showToast('✓ All sales data has been reset to zero!', 'success');
}

// Token Verification
function verifyTokenCode() {
    const tokenInput = $('#tokenInput').val().trim().toUpperCase();
    
    if (tokenInput.length !== 8) {
        showToast('Token must be 8 characters', 'warning');
        return;
    }

    const order = orders.find(o => o.token === tokenInput && o.status !== 'completed');
    const resultDiv = $('#tokenResult');

    if (order) {
        resultDiv.removeClass('token-error').addClass('token-success');
        let itemsHtml = order.items.map(item => `
            <div class="order-detail-item">
                <span>${item.name} × ${item.quantity}</span>
                <span>MWK ${(item.price * item.quantity).toLocaleString()}</span>
            </div>
        `).join('');
        
        resultDiv.html(`
            <h3 style="color: var(--success-color); margin-bottom:15px;">
                <i class="fas fa-check-circle"></i> Valid Token
            </h3>
            <div class="order-details">
                <div class="order-detail-item">
                    <strong>Order ID:</strong>
                    <span>${order.id}</span>
                </div>
                <div class="order-detail-item">
                    <strong>Customer:</strong>
                    <span>${order.customerName || 'Customer'}</span>
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
            ${itemsHtml}
            <button class="btn btn-primary btn-block btn-release" onclick="releaseOrder('${order.id}')">
                <i class="fas fa-check"></i> Release Goods
            </button>
        `);
    } else {
        resultDiv.removeClass('token-success').addClass('token-error');
        resultDiv.html(`
            <h3 style="color: var(--danger-color);">
                <i class="fas fa-times-circle"></i> Invalid Token
            </h3>
            <p style="margin-top:10px; color:var(--text-secondary);">
                Token not found, already used, or order completed. Please check and try again.
            </p>
        `);
    }
}

function releaseOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        // Mark order as completed/released
        order.status = 'completed';
        order.releasedBy = currentUser.name;
        order.releasedAt = new Date().toISOString();
        
        // Assign to staff if not already assigned
        if (!order.staffId) {
            order.staffId = currentUser.id;
        }
        
        // IMPORTANT: Save back to localStorage so manager can see the updated status
        localStorage.setItem('orders', JSON.stringify(orders));
        // mark related notification as verified (customer collected)
        markNotificationVerifiedByOrderId(orderId);
        
        // UPDATE TODAY'S SALES AND AMOUNT
        loadStaffDashboard();
        
        console.log('✓ Order ' + orderId + ' released by ' + currentUser.name);
        showToast('Goods released successfully! Sale registered.', 'success');
        $('#tokenInput').val('');
        $('#tokenResult').html('');
    }
}

// Process Sale - NO TOKENS FOR IN-STORE SALES
function loadSaleProducts() {
    const list = $('#saleProductsList');
    list.html('');

    products.forEach(product => {
        if (product.stock > 0) {
            const item = $('<div>')
                .addClass('product-list-item')
                .html(`
                    <div>
                        <div style="font-size:14px; font-weight:600;">${product.icon} ${product.name}</div>
                        <div style="font-size:12px; color:var(--text-secondary);">MWK ${product.price.toLocaleString()} | Stock: ${product.stock}</div>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <input type="number" id="qty_input_${product.id}" class="add-qty-input" min="1" max="${product.stock}" value="1" style="width:80px; padding:6px; border-radius:6px; border:1px solid #ddd; text-align:center;">
                        <button class="btn-add-cart" onclick="addToSale(${product.id}, parseInt(document.getElementById('qty_input_${product.id}').value || '1'))">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                `);
            list.append(item);
        }
    });
}

// jQuery event handling for search
$(document).ready(function() {
    $('#searchSaleProducts').on('input', function(e) {
        const searchTerm = $(this).val().toLowerCase();
        const filtered = products.filter(p => 
            (p.name.toLowerCase().includes(searchTerm) || 
            p.category.toLowerCase().includes(searchTerm)) &&
            p.stock > 0
        );

        const list = $('#saleProductsList');
        list.html('');

        filtered.forEach(product => {
            const item = $('<div>')
                .addClass('product-list-item')
                .html(`
                    <div>
                        <div style="font-size:14px; font-weight:600;">${product.icon} ${product.name}</div>
                        <div style="font-size:12px; color:var(--text-secondary);">MWK ${product.price.toLocaleString()} | Stock: ${product.stock}</div>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <input type="number" id="qty_input_${product.id}" class="add-qty-input" min="1" max="${product.stock}" value="1" style="width:80px; padding:6px; border-radius:6px; border:1px solid #ddd; text-align:center;">
                        <button class="btn-add-cart" onclick="addToSale(${product.id}, parseInt(document.getElementById('qty_input_${product.id}').value || '1'))">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                `);
            list.append(item);
        });
    });
});

function addToSale(productId, qty = 1) {
    qty = parseInt(qty) || 1;
    if (qty < 1) { showToast('Quantity must be at least 1', 'warning'); return; }

    const product = products.find(p => p.id === productId);
    if (!product) { showToast('Product not found', 'error'); return; }

    const existingItem = saleItems.find(item => item.productId === productId);

    if (existingItem) {
        const newQty = existingItem.quantity + qty;
        if (newQty > product.stock) {
            showToast('Not enough stock', 'warning');
            return;
        }
        existingItem.quantity = newQty;
    } else {
        if (qty > product.stock) { showToast('Not enough stock', 'warning'); return; }
        saleItems.push({
            productId: productId,
            name: product.name,
            price: product.price,
            quantity: qty,
            icon: product.icon
        });
    }

    loadSaleItems();
}

function loadSaleItems() {
    const container = $('#saleItems');
    container.html('');

    if (saleItems.length === 0) {
        container.html('<p style="text-align:center; color:#6b7280; padding:20px;">No items added</p>');
        $('#saleTotal').text('MWK 0');
        return;
    }

    saleItems.forEach((item, index) => {
        const product = products.find(p => p.id === item.productId) || {};
        const maxStock = product.stock || item.quantity;
        const div = $('<div>')
            .addClass('order-detail-item')
            .html(`
                <div>
                    <div style="font-weight:600;">${item.icon} ${item.name}</div>
                    <div style="font-size:12px; color:var(--text-secondary);">MWK ${item.price.toLocaleString()}</div>
                </div>
                <div style="text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
                    <input type="number" value="${item.quantity}" min="1" max="${maxStock}" onchange="updateSaleItemQuantity(${index}, this.value)" style="width:100px; padding:6px; border-radius:6px; border:1px solid #ddd; text-align:center;">
                    <div style="font-weight:600;">MWK ${(item.price * item.quantity).toLocaleString()}</div>
                    <button class="btn-remove" style="font-size:11px; padding:4px 8px;" onclick="removeSaleItem(${index})">
                        <i class="fas fa-times"></i> Remove
                    </button>
                </div>
            `);
        container.append(div);
    });

    const total = saleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    $('#saleTotal').text(`MWK ${total.toLocaleString()}`);
}

// Update quantity from cart input
function updateSaleItemQuantity(index, newQty) {
    newQty = parseInt(newQty) || 0;
    if (index < 0 || index >= saleItems.length) return;

    const item = saleItems[index];
    const product = products.find(p => p.id === item.productId) || {};
    const maxStock = product.stock || item.quantity;

    if (newQty <= 0) {
        // remove the item if qty set to 0
        saleItems.splice(index, 1);
        loadSaleItems();
        return;
    }

    if (newQty > maxStock) {
        showToast('Quantity exceeds available stock', 'warning');
        newQty = maxStock;
    }

    item.quantity = newQty;
    loadSaleItems();
}

function removeSaleItem(index) {
    saleItems.splice(index, 1);
    loadSaleItems();
}

// UPDATED: Complete Sale WITHOUT Token Generation
function completeSale() {
    if (saleItems.length === 0) {
        showToast('No items in sale', 'warning');
        return;
    }

    const paymentMethod = $('#salePaymentMethod').val();
    const customerName = $('#saleCustomerName').val() || 'Walk-in Customer';
    const total = saleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Update stock
    saleItems.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            product.stock -= item.quantity;
        }
    });
    localStorage.setItem('products', JSON.stringify(products));

    // Create sale record
    const sale = {
        id: 'SALE' + Date.now(),
        staffId: currentUser.id,
        staffName: currentUser.name,
        customerName: customerName,
        items: [...saleItems],
        total: total,
        paymentMethod: paymentMethod,
        date: new Date().toISOString(),
        type: 'in-store',
        status: 'completed'
    };

    // Save to orders (local copy)
    const allOrders = localStorage.getItem('orders');
    const ordersList = allOrders ? JSON.parse(allOrders) : [];
    ordersList.push(sale);
    localStorage.setItem('orders', JSON.stringify(ordersList));

    // Payment handling - NO TOKEN FOR IN-STORE SALES
    function finalizePayment() {
        // Save payment record to SQLite if available
        if (typeof savePayment === 'function') {
            savePayment(sale.id, sale.customerId || null, total, paymentMethod, 'MOCKREF' + Date.now(), 'completed', null, function(res) {
                console.log('✓ Payment record saved');
            });
        }

        // Show success message WITHOUT token
        const successMessage = `✓ Sale Completed Successfully!\n\nTotal: MWK ${total.toLocaleString()}\nPayment Method: ${paymentMethod}\nCustomer: ${customerName}`;
        alert(successMessage);

        console.log('✓ In-store sale completed - No token generated');
        
        showToast(`Sale completed! Total: MWK ${total.toLocaleString()}`, 'success');
        
        // Reset sale form
        saleItems = [];
        $('#saleCustomerName').val('');
        $('#salePaymentMethod').val('cash');
        loadSaleItems();
        loadSaleProducts();
        loadStaffDashboard(); // Refresh stats
    }

    if (paymentMethod === 'mobile' || paymentMethod === 'bank_transfer') {
        const pin = prompt('Enter mobile/bank PIN to authorize payment (mock):');
        if (!pin || !/^[0-9]{3,6}$/.test(pin)) {
            showToast('Invalid PIN entered. Transaction cancelled.', 'error');
            return;
        }

        // Simulate PIN validation
        showToast('Processing payment...', 'info');
        setTimeout(() => {
            finalizePayment();
        }, 900);
    } else {
        // Cash/card/other - finalize immediately
        finalizePayment();
    }
}

// Sales History Functions
function filterSalesHistory(period) {
    const list = $('#salesHistoryList');
    list.html('');

    $('#salesHistory .tab').removeClass('active');
    if (event?.target) {
        $(event.target).addClass('active');
    }

    let filtered = orders.filter(o => o.staffId === currentUser.id);
    
    const now = new Date();
    if (period === 'today') {
        filtered = filtered.filter(o => new Date(o.date).toDateString() === now.toDateString());
    } else if (period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(o => new Date(o.date) >= weekAgo);
    }

    if (filtered.length === 0) {
        list.html('<div class="welcome-card"><p style="text-align:center;">No sales found for this period</p></div>');
        return;
    }

    filtered.reverse().forEach(sale => {
        const card = $('<div>')
            .addClass('welcome-card')
            .html(`
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <strong>${sale.customerName}</strong>
                    <span style="font-size:12px; color:var(--text-secondary);">${new Date(sale.date).toLocaleDateString()}</span>
                </div>
                <div class="order-detail-item">
                    <span>Total Items:</span>
                    <strong>${sale.items.length}</strong>
                </div>
                <div class="order-detail-item">
                    <span>Amount:</span>
                    <strong>MWK ${sale.total.toLocaleString()}</strong>
                </div>
                <div class="order-detail-item">
                    <span>Payment:</span>
                    <strong>${sale.paymentMethod.replace('_', ' ')}</strong>
                </div>
            `);
        list.append(card);
    });
}

// Stock Check
function filterStock(filter) {
    const list = $('#stockList');
    list.html('');

    $('#stockCheck .tab').removeClass('active');
    if (event?.target) {
        $(event.target).addClass('active');
    }

    let filtered = products;
    if (filter === 'low') {
        filtered = products.filter(p => p.stock <= p.lowStock && p.stock > 0);
    } else if (filter === 'out') {
        filtered = products.filter(p => p.stock === 0);
    }

    if (filtered.length === 0) {
        list.html('<p style="text-align:center; padding:40px; color:#6b7280;">No items found</p>');
        return;
    }

    filtered.forEach(product => {
        let badgeClass = 'good';
        let badgeText = 'Good';
        if (product.stock === 0) {
            badgeClass = 'out';
            badgeText = 'Out';
        } else if (product.stock <= product.lowStock) {
            badgeClass = 'low';
            badgeText = 'Low';
        }

        const card = $('<div>')
            .addClass('welcome-card')
            .html(`
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <h4>${product.icon} ${product.name}</h4>
                    <span class="stock-badge ${badgeClass}">${badgeText}</span>
                </div>
                <div class="order-detail-item">
                    <span>Category:</span>
                    <span>${product.category}</span>
                </div>
                <div class="order-detail-item">
                    <span>Current Stock:</span>
                    <strong>${product.stock} units</strong>
                </div>
                <div class="order-detail-item">
                    <span>Low Stock Alert:</span>
                    <span>${product.lowStock}</span>
                </div>
                <div class="order-detail-item">
                    <span>Price:</span>
                    <span>MWK ${product.price.toLocaleString()}</span>
                </div>
            `);
        list.append(card);
    });
}

// Utility Functions
function showToast(message, type = 'success') {
    const toast = $('#toast');
    if (toast.length) {
        toast.text(message)
            .removeClass('success error warning info')
            .addClass(type)
            .addClass('show');
        
        setTimeout(() => {
            toast.removeClass('show');
        }, 3000);
    }
}

function logout() {
    sessionStorage.removeItem('currentUser');
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Reset only today's sales and verified tokens for current staff
function resetTodaysSalesData() {
    if (!confirm("⚠️ Reset only TODAY's sales and verified tokens to zero for your account?")) {
        return;
    }

    const today = new Date().toDateString();

    // Load all orders from storage and filter out today's entries for this staff
    const existing = localStorage.getItem('orders');
    const allOrders = existing ? JSON.parse(existing) : [];

    const filtered = allOrders.filter(o => {
        const orderDate = o.date ? new Date(o.date).toDateString() : null;
        const releasedDate = o.releasedAt ? new Date(o.releasedAt).toDateString() : null;

        const sameStaffToday = (o.staffId === currentUser.id || o.staffName === currentUser.name) && orderDate === today;
        const releasedByToday = o.releasedBy === currentUser.name && releasedDate === today;

        // keep the order if it's NOT one of today's orders/releases by this staff
        return !(sameStaffToday || releasedByToday);
    });

    // Update in-memory and persisted orders
    orders = filtered;
    localStorage.setItem('orders', JSON.stringify(orders));

    // Reset dashboard figures and token UI
    $('#todaySalesCount').text('0');
    $('#todaySalesAmount').text('MWK 0');
    $('#verifiedTokens').text('0');
    $('#tokenInput').val('');
    $('#tokenResult').html('');

    // Refresh dashboard calculations
    loadStaffDashboard();

    console.log('✓ Today\'s sales/token reset to zero by ' + currentUser.name);
    showToast('✓ Today\'s sales and verified tokens reset to zero!', 'success');
}

// Notifications
function loadNotifications() {
    const container = $('#notificationsList');
    container.html('');

    if (!notifications || notifications.length === 0) {
        container.html('<div class="welcome-card"><p style="text-align:center;">No notifications</p></div>');
        return;
    }

    // Show newest first
    const list = [...notifications].reverse();
    list.forEach(n => {
        const statusLabel = n.status === 'verified' ? '<span class="text-success">Verified</span>' : '<span class="text-warning">Not Verified</span>';
        const itemsSummary = n.items.map(i => `${i.name} × ${i.quantity}`).join('<br>');
        const tokenHtml = n.token ? `<div style="margin-top:8px;"><strong>Token:</strong> <span style="font-weight:700; letter-spacing:2px;">${n.token}</span></div>` : '';
        const copyBtn = n.token ? `<button class="btn" style="margin-right:8px;" onclick="copyNotificationToken('${n.token}')"><i class="fas fa-copy"></i> Copy</button>` : '';
        const useBtn = n.token ? `<button class="btn btn-primary" onclick="useNotificationToken('${n.token}')"><i class="fas fa-sign-in-alt"></i> Use Token</button>` : '';

        const card = $('<div>').addClass('welcome-card').html(`
            <h4 style="display:flex; justify-content:space-between; align-items:center;">${n.orderId} ${statusLabel}</h4>
            <p><strong>Customer:</strong> ${n.customerName}</p>
            <p><strong>Items:</strong><br>${itemsSummary}</p>
            <p><strong>Total:</strong> MWK ${n.total.toLocaleString()}</p>
            ${tokenHtml}
            <p><small>${new Date(n.date).toLocaleString()}</small></p>
            <div style="margin-top:10px; display:flex; gap:8px; align-items:center;">
                ${copyBtn}
                ${useBtn}
                ${n.status === 'not_verified' ? `<button class="btn btn-primary" onclick="markNotificationVerified('${n.id}')">Mark as Verified</button>` : ''}
            </div>
        `);
        container.append(card);
    });
}

// Copy token to clipboard
function copyNotificationToken(token) {
    if (!token) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(token).then(() => {
            showToast('Token copied to clipboard', 'success');
        }).catch(() => {
            // fallback
            const ta = document.createElement('textarea');
            ta.value = token;
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); showToast('Token copied to clipboard', 'success'); } catch (e) { showToast('Copy failed', 'error'); }
            ta.remove();
        });
    } else {
        const ta = document.createElement('textarea');
        ta.value = token;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); showToast('Token copied to clipboard', 'success'); } catch (e) { showToast('Copy failed', 'error'); }
        ta.remove();
    }
}

// Use token: fill verify input and navigate to Verify Token screen
function useNotificationToken(token) {
    if (!token) return;
    showSection('verifyToken');
    setTimeout(() => {
        $('#tokenInput').val(token);
        // optionally auto-run verification
        // verifyTokenCode();
    }, 120);
}

function markNotificationVerified(notificationId) {
    const idx = notifications.findIndex(n => n.id === notificationId);
    if (idx === -1) return;
    notifications[idx].status = 'verified';
    localStorage.setItem('notifications', JSON.stringify(notifications));
    loadNotifications();
    loadStaffDashboard();
}

function markNotificationVerifiedByOrderId(orderId) {
    let changed = false;
    notifications.forEach(n => {
        if (n.orderId === orderId && n.status !== 'verified') {
            n.status = 'verified';
            changed = true;
        }
    });
    if (changed) {
        localStorage.setItem('notifications', JSON.stringify(notifications));
        loadNotifications();
        loadStaffDashboard();
    }
}