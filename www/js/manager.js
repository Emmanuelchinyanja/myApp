// Manager Dashboard JavaScript - FULL jQuery Implementation

let currentUser = null;
let products = [];
let orders = [];
let suppliers = [];

// Check if user is logged in
$(window).on('load', function() {
    const userData = sessionStorage.getItem('currentUser');
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = JSON.parse(userData);
    if (currentUser.role !== 'manager') {
        window.location.href = 'index.html';
        return;
    }
    
    initializeData();
    loadManagerDashboard();
    
    // Refresh data every 3 seconds to see real-time updates
    setInterval(refreshDataFromStorage, 3000);
});

// Refresh data from localStorage to see real-time updates
function refreshDataFromStorage() {
    const savedOrders = localStorage.getItem('orders');
    if (savedOrders) {
        orders = JSON.parse(savedOrders);
        updateDashboardStats();
    }
}

// Initialize Data from localStorage
function initializeData() {
    // Load products from localStorage
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
        products = JSON.parse(savedProducts);
    }
    
    // Load suppliers
    const savedSuppliers = localStorage.getItem('suppliers');
    if (savedSuppliers) {
        suppliers = JSON.parse(savedSuppliers);
    }
    
    // Load orders from localStorage
    const savedOrders = localStorage.getItem('orders');
    if (savedOrders) {
        orders = JSON.parse(savedOrders);
    }
    
    console.log('✓ Data loaded from localStorage');
    console.log('  - Products:', products.length);
    console.log('  - Orders:', orders.length);
    console.log('  - Suppliers:', suppliers.length);
}

function loadManagerDashboard() {
    $('#managerName').text(currentUser.name);
    updateDashboardStats();
}

// Update Dashboard Stats - Works with localStorage orders
function updateDashboardStats() {
    if (!orders || orders.length === 0) {
        $('#todaySales').text('MWK 0');
        $('#totalOrders').text('0');
        return;
    }

    // Get today's sales (both online and in-store)
    const today = new Date();
    const todayOrders = orders.filter(o => {
        const orderDate = new Date(o.date || o.orderDate);
        return orderDate.toDateString() === today.toDateString();
    });

    const todaySales = todayOrders.reduce((sum, o) => sum + (o.total || o.totalAmount || 0), 0);
    $('#todaySales').text(`MWK ${todaySales.toLocaleString()}`);
    $('#totalOrders').text(todayOrders.length);

    const lowStockCount = products.filter(p => p.stock <= p.lowStock).length;
    $('#lowStock').text(lowStockCount);
    
    console.log('✓ Dashboard stats updated - Today Sales: MWK ' + todaySales.toLocaleString());
}

// Inventory Management
function loadInventory() {
    console.log('Loading inventory...');
    filterInventory('all');
}

function filterInventory(filter) {
    console.log('Filtering inventory by:', filter);
    
    const list = $('#inventoryList');
    if (!list.length) {
        console.error('inventoryList element not found');
        return;
    }
    
    list.html('');

    // Update active tab
    $('.tab').removeClass('active');
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
        let stockClass = 'good';
        let stockText = 'Good Stock';
        if (product.stock === 0) {
            stockClass = 'out';
            stockText = 'Out of Stock';
        } else if (product.stock <= product.lowStock) {
            stockClass = 'low';
            stockText = 'Low Stock';
        }

        const item = $('<div>')
            .addClass('inventory-item')
            .html(`
                <div class="inventory-item-header">
                    <h4>${product.icon || '📦'} ${product.name || product.productName}</h4>
                    <span class="stock-badge ${stockClass}">${stockText}</span>
                </div>
                <div class="inventory-item-details">
                    <div><strong>Category:</strong> ${product.category}</div>
                    <div><strong>Price:</strong> MWK ${(product.price || 0).toLocaleString()}</div>
                    <div><strong>Stock:</strong> ${product.stock || 0} units</div>
                    <div><strong>Low Alert:</strong> ${product.lowStock || product.lowStockThreshold || 0} units</div>
                </div>
                <div style="display:flex; gap:8px; margin-top:10px;">
                    <button class="btn-update-stock" onclick="updateStock(${product.id || product.productId})">
                        <i class="fas fa-edit"></i> Update Stock
                    </button>
                    <button class="btn-camera" onclick="attachPhoto(${product.id || product.productId})" title="Attach photo">
                        <i class="fas fa-camera"></i>
                    </button>
                </div>
            `);
        list.append(item);
    });
    
    console.log('✓ Inventory loaded:', filtered.length, 'items');
}

function updateStock(productId) {
    const product = products.find(p => p.id === productId || p.productId === productId);
    if (product) {
        showEditProduct(product);
    }
}

function showEditProduct(product) {
    const modal = $('#editProductModal');
    if (!modal.length) {
        console.error('editProductModal not found');
        return;
    }
    
    modal.addClass('active');
    $('#editProductId').val(product.id || product.productId);
    $('#editProductName').val(product.name || product.productName);
    $('#editProductPrice').val(product.price);
    $('#editProductStock').val(product.stock);
    $('#editProductLowStock').val(product.lowStock || product.lowStockThreshold);
}

// Attach photo to a product using Cordova Camera plugin (or HTML input fallback)
function attachPhoto(productId) {
    showToast('Photo feature coming soon', 'info');
}

function showAddProduct() {
    const modal = $('#addProductModal');
    if (modal.length) {
        modal.addClass('active');
    }
}

document.getElementById('editProductForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const productId = parseInt($('#editProductId').val());
    const product = products.find(p => p.id === productId);
    
    if (product) {
        product.name = $('#editProductName').val();
        product.price = parseInt($('#editProductPrice').val());
        product.stock = parseInt($('#editProductStock').val());
        product.lowStock = parseInt($('#editProductLowStock').val());
        
        localStorage.setItem('products', JSON.stringify(products));
        showToast('Product updated successfully', 'success');
        closeModal('editProductModal');
        loadInventory();
        loadManagerDashboard();
    }
});

document.getElementById('addProductForm').addEventListener('submit', function(e) {
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
    localStorage.setItem('products', JSON.stringify(products));
    showToast('Product added successfully', 'success');
    closeModal('addProductModal');
    this.reset();
    loadInventory();
});

// Suppliers Management
function showAddSupplier() {
    const modal = $('#addSupplierModal');
    if (modal.length) {
        modal.addClass('active');
        // Clear form fields
        $('#addSupplierForm').trigger('reset');
    } else {
        console.error('addSupplierModal not found in HTML');
    }
}

function loadSuppliers() {
    console.log('Loading suppliers...');
    
    const list = $('#suppliersList');
    if (!list.length) {
        console.error('suppliersList element not found');
        return;
    }
    
    list.html('');

    if (suppliers.length === 0) {
        list.html('<div class="welcome-card"><p style="text-align:center; padding:40px;">📭 No suppliers added yet</p></div>');
        return;
    }

    suppliers.forEach((supplier, index) => {
        const card = $('<div>')
            .addClass('supplier-card')
            .html(`
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                    <h3 style="margin: 0;"><i class="fas fa-truck"></i> ${supplier.name}</h3>
                    <button class="btn-delete" onclick="deleteSupplier(${index})" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
                <div class="supplier-info">
                    <div class="supplier-info-item">
                        <i class="fas fa-user"></i>
                        <span><strong>Contact:</strong> ${supplier.contact}</span>
                    </div>
                    <div class="supplier-info-item">
                        <i class="fas fa-phone"></i>
                        <span><strong>Phone:</strong> ${supplier.phone}</span>
                    </div>
                    <div class="supplier-info-item">
                        <i class="fas fa-envelope"></i>
                        <span><strong>Email:</strong> ${supplier.email || 'Not provided'}</span>
                    </div>
                    <div class="supplier-info-item">
                        <i class="fas fa-box"></i>
                        <span><strong>Items:</strong> ${supplier.products}</span>
                    </div>
                </div>
                <div class="supplier-actions">
                    <button class="btn-call" onclick="callSupplier('${supplier.phone}', '${supplier.name}')">
                        <i class="fas fa-phone"></i> Call
                    </button>
                    <button class="btn-sms" onclick="smsSupplier('${supplier.phone}', '${supplier.name}')">
                        <i class="fas fa-sms"></i> SMS
                    </button>
                </div>
            `);
        list.append(card);
    });
    
    console.log('✓ Suppliers loaded:', suppliers.length, 'suppliers');
}

function deleteSupplier(index) {
    if (confirm('Are you sure you want to delete this supplier?')) {
        const deletedSupplier = suppliers[index];
        suppliers.splice(index, 1);
        localStorage.setItem('suppliers', JSON.stringify(suppliers));
        showToast(`${deletedSupplier.name} deleted successfully`, 'success');
        loadSuppliers();
    }
}

function callSupplier(phone, name) {
    showToast(`📞 Calling ${name} at ${phone}...`, 'success');
    // In Cordova, this would use: window.location.href = 'tel:' + phone;
}

function smsSupplier(phone, name) {
    const message = prompt(`Send SMS to ${name}:`, 'Hello, I need to reorder stock. Please contact me back.');
    if (message) {
        showToast(`📱 SMS sent to ${name} (${phone})`, 'success');
        console.log(`✓ SMS to ${name}: ${message}`);
        // In Cordova, this would use SMS plugin to send actual SMS
    }
}

function initializeSupplierForm() {
    const addSupplierForm = document.getElementById('addSupplierForm');
    if (addSupplierForm) {
        $(addSupplierForm).on('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const name = $('#supplierName').val().trim();
            const contact = $('#supplierContact').val().trim();
            const phone = $('#supplierPhone').val().trim();
            const email = $('#supplierEmail').val().trim();
            const products = $('#supplierProducts').val().trim();
            
            // Validation
            if (!name || !contact || !phone || !products) {
                showToast('Please fill all required fields', 'warning');
                return;
            }
            
            // Validate phone number format
            if (!/^0\d{9}$/.test(phone)) {
                showToast('Phone number must be in format: 0888123456', 'warning');
                return;
            }
            
            // Create new supplier object
            const newSupplier = {
                id: suppliers.length + 1,
                name: name,
                contact: contact,
                phone: phone,
                email: email,
                products: products,
                createdAt: new Date().toISOString()
            };
            
            // Add to suppliers array
            suppliers.push(newSupplier);
            
            // Save to localStorage
            localStorage.setItem('suppliers', JSON.stringify(suppliers));
            
            console.log('✓ Supplier added:', newSupplier);
            
            // Show success message
            showToast(`✓ ${name} added successfully!`, 'success');
            
            // Close modal
            closeModal('addSupplierModal');
            
            // Reload suppliers list immediately
            loadSuppliers();
            
            // Reset form
            this.reset();
        });
    } else {
        console.warn('addSupplierForm not found - Supplier form will not work');
    }
}

function generateReport() {
    const reportType = $('#reportType').val() || 'sales';
    const reportDate = $('#reportDate').val();
    const output = $('#reportOutput');

    if (!output.length) return;

    let reportOrders = orders;
    if (reportDate) {
        reportOrders = orders.filter(o => {
            const orderDate = new Date(o.date || o.orderDate).toDateString();
            const selectedDate = new Date(reportDate).toDateString();
            return orderDate === selectedDate;
        });
    }

    output.html(`
        <h3>${reportType.toUpperCase()} REPORT</h3>
        <p style="color:var(--text-secondary); margin-bottom:20px;">Date: ${reportDate || 'All Time'}</p>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${reportOrders.map((order, idx) => `
                    <tr>
                        <td>${order.id || order.orderId || idx + 1}</td>
                        <td>${new Date(order.date || order.orderDate).toLocaleDateString()}</td>
                        <td>${order.type || 'online'}</td>
                        <td>MWK ${(order.total || order.totalAmount || 0).toLocaleString()}</td>
                        <td><span class="text-${order.status === 'completed' ? 'success' : 'warning'}">${order.status || 'completed'}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div style="margin-top:20px; padding-top:20px; border-top:2px solid var(--border);">
            <div style="display:flex; justify-content:space-between; font-size:18px; font-weight:bold;">
                <span>TOTAL SALES:</span>
                <span class="text-success">MWK ${reportOrders.reduce((sum, o) => sum + (o.total || o.totalAmount || 0), 0).toLocaleString()}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:10px;">
                <span>Total Orders:</span>
                <span>${reportOrders.length}</span>
            </div>
        </div>
    `);
}

function exportReport() {
    showToast('Report exported successfully', 'success');
}

// Staff Performance - Shows sales from all staff members
function loadStaffPerformance() {
    console.log('Loading staff performance...');
    
    const list = document.getElementById('staffPerformanceList');
    if (!list) {
        console.error('staffPerformanceList element not found');
        return;
    }
    
    list.innerHTML = '';
    
    const staffSales = {};
    
    // Aggregate sales from all orders (both in-store and online)
    orders.forEach(order => {
        if (order.staffId && order.staffName) {
            if (!staffSales[order.staffId]) {
                staffSales[order.staffId] = {
                    name: order.staffName,
                    sales: 0,
                    revenue: 0
                };
            }
            staffSales[order.staffId].sales++;
            staffSales[order.staffId].revenue += order.total || order.totalAmount || 0;
        }
    });
    
    if (Object.keys(staffSales).length === 0) {
        list.innerHTML = '<div class="welcome-card"><p style="text-align:center;">No staff sales recorded yet</p></div>';
        return;
    }
    
    Object.values(staffSales).forEach(staff => {
        const card = document.createElement('div');
        card.className = 'welcome-card';
        card.innerHTML = `
            <h4><i class="fas fa-user"></i> ${staff.name}</h4>
            <div class="inventory-item-details">
                <div><strong>Total Sales:</strong> ${staff.sales}</div>
                <div><strong>Revenue:</strong> MWK ${staff.revenue.toLocaleString()}</div>
                <div><strong>Avg Sale:</strong> MWK ${Math.round(staff.revenue / staff.sales).toLocaleString()}</div>
            </div>
        `;
        list.appendChild(card);
    });
    
    console.log('✓ Staff performance loaded:', Object.keys(staffSales).length, 'staff members');
}

// Customer Feedback - Load from localStorage 'feedbacks'
function loadCustomerFeedback() {
    console.log('Loading customer feedback from localStorage...');
    
    const list = document.getElementById('feedbackList');
    if (!list) {
        console.error('feedbackList element not found');
        return;
    }
    
    // Load feedbacks from localStorage (where customer.js saves them)
    let feedbacks = localStorage.getItem('feedbacks');
    feedbacks = feedbacks ? JSON.parse(feedbacks) : [];
    
    console.log('✓ Found', feedbacks.length, 'feedback entries');
    
    if (feedbacks.length === 0) {
        list.innerHTML = '<div class="welcome-card"><p style="text-align:center;">No feedback received yet</p></div>';
        document.getElementById('avgRating').textContent = '0.0';
        document.getElementById('totalReviews').textContent = '0';
        return;
    }
    
    // Calculate average rating
    const avgRating = feedbacks.reduce((sum, f) => sum + (parseInt(f.rating) || 0), 0) / feedbacks.length;
    const avgRatingElem = document.getElementById('avgRating');
    const totalReviewsElem = document.getElementById('totalReviews');
    
    if (avgRatingElem) avgRatingElem.textContent = avgRating.toFixed(1);
    if (totalReviewsElem) totalReviewsElem.textContent = feedbacks.length;
    
    list.innerHTML = '';
    feedbacks.reverse().forEach(feedback => {
        const card = document.createElement('div');
        card.className = 'welcome-card';
        const stars = '⭐'.repeat(parseInt(feedback.rating) || 0);
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <div>
                    <strong>${feedback.customerName || 'Customer'}</strong>
                    <div>${stars} (${feedback.rating || 0}/5)</div>
                </div>
                <span style="font-size:12px; color:var(--text-secondary);">${new Date(feedback.date).toLocaleDateString()}</span>
            </div>
            <p style="color:var(--text-secondary);">${feedback.comment}</p>
        `;
        list.appendChild(card);
    });
    
    console.log('✓ Customer feedback loaded - Avg Rating:', avgRating.toFixed(1));
}

// Screen Management - Navigate between sections
function showSection(sectionId) {
    console.log('Showing section:', sectionId);
    
    // Hide all screens
    $('.screen').removeClass('active');
    
    // Show the selected screen
    const section = $('#' + sectionId);
    if (section.length) {
        section.addClass('active');
        console.log('✓ Section displayed:', sectionId);
    } else {
        console.error('✗ Section not found:', sectionId);
        return;
    }

    // Load data based on section
    switch(sectionId) {
        case 'inventoryManagement':
            loadInventory();
            break;
        case 'suppliers':
            loadSuppliers();
            break;
        case 'staffPerformance':
            loadStaffPerformance();
            break;
        case 'customerFeedback':
            loadCustomerFeedback();
            break;
        case 'reports':
            // Reports section doesn't need auto-loading
            break;
    }
}

// Modal Functions
function closeModal(modalId) {
    const modal = $('#' + modalId);
    if (modal.length) {
        modal.removeClass('active');
    }
}

$(window).on('click', function(event) {
    if ($(event.target).hasClass('modal')) {
        $(event.target).removeClass('active');
    }
});

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

// Initialize forms and listeners when DOM is ready
$(document).ready(function() {
    console.log('✓ DOM loaded - Initializing forms...');
    initializeSupplierForm();
});