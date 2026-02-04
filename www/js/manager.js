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
    
    // Wait for DB/localStorage to be ready, then initialize
    waitForDataReady(function() {
        initializeData();
        loadManagerDashboard();

        // Refresh data every 3 seconds to see real-time updates (products + orders + suppliers)
        setInterval(refreshAllFromStorage, 3000);
        
        // Also listen for storage events from other tabs
        window.addEventListener('storage', function(e) {
            if (e.key === 'orders' || e.key === 'products' || e.key === 'suppliers') {
                refreshAllFromStorage();
            }
        });
    });
});

// Wait until dbReady flag or localStorage has products key
function waitForDataReady(cb, attempts = 0) {
    if (window.dbReady || localStorage.getItem('products') !== null || attempts > 30) {
        cb();
    } else {
        setTimeout(() => waitForDataReady(cb, attempts + 1), 200);
    }
}

// Refresh data from localStorage to see real-time updates
function refreshDataFromStorage() {
    const savedOrders = localStorage.getItem('orders');
    if (savedOrders) {
        orders = JSON.parse(savedOrders);
    }
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
        products = JSON.parse(savedProducts);
    }
    const savedSuppliers = localStorage.getItem('suppliers');
    if (savedSuppliers) {
        suppliers = JSON.parse(savedSuppliers);
    }
    updateDashboardStats();
}

// Refresh products, orders and suppliers from storage
function refreshAllFromStorage() {
    const sp = localStorage.getItem('products');
    if (sp) products = JSON.parse(sp);

    const so = localStorage.getItem('orders');
    if (so) orders = JSON.parse(so);

    const ss = localStorage.getItem('suppliers');
    if (ss) suppliers = JSON.parse(ss);

    updateDashboardStats();
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
    const reportType = $('#reportType').val() || 'daily';
    const reportDate = $('#reportDate').val();
    const output = $('#reportOutput');

    if (!output.length) return;

    let reportOrders = orders;
    let reportTitle = '';
    let reportContent = '';

    // Filter by date if provided
    if (reportDate) {
        reportOrders = orders.filter(o => {
            const orderDate = new Date(o.date || o.orderDate).toDateString();
            const selectedDate = new Date(reportDate).toDateString();
            return orderDate === selectedDate;
        });
    }

    const totalSales = reportOrders.reduce((sum, o) => sum + (o.total || o.totalAmount || 0), 0);
    const totalOrdersCount = reportOrders.length;

    switch(reportType) {
        case 'daily':
            reportTitle = 'DAILY SALES REPORT';
            reportContent = generateDailySalesReport(reportOrders, reportDate);
            break;
        case 'weekly':
            reportTitle = 'WEEKLY SALES REPORT';
            reportContent = generateWeeklySalesReport(reportOrders, reportDate);
            break;
        case 'monthly':
            reportTitle = 'MONTHLY SALES REPORT';
            reportContent = generateMonthlySalesReport(reportOrders, reportDate);
            break;
        case 'inventory':
            reportTitle = 'INVENTORY REPORT';
            reportContent = generateInventoryReport();
            break;
        case 'products':
            reportTitle = 'PRODUCT PERFORMANCE REPORT';
            reportContent = generateProductPerformanceReport(reportOrders);
            break;
        default:
            reportTitle = 'SALES REPORT';
            reportContent = generateDailySalesReport(reportOrders, reportDate);
    }

    output.html(`
        <div class="report-header">
            <h3>${reportTitle}</h3>
            <p style="color:var(--text-secondary); margin-bottom:20px;">Date: ${reportDate || 'All Time'}</p>
        </div>
        ${reportContent}
        <div style="margin-top:20px; text-align:center;">
            <button class="btn btn-primary" onclick="exportToPDF('${reportType}')">
                <i class="fas fa-download"></i> Export to PDF
            </button>
            <button class="btn btn-secondary" onclick="exportToExcel('${reportType}')">
                <i class="fas fa-file-excel"></i> Export to Excel
            </button>
        </div>
    `);
}

function generateDailySalesReport(reportOrders, reportDate) {
    const totalSales = reportOrders.reduce((sum, o) => sum + (o.total || o.totalAmount || 0), 0);
    const paymentBreakdown = {};
    
    reportOrders.forEach(order => {
        const method = order.paymentMethod || 'cash';
        if (!paymentBreakdown[method]) {
            paymentBreakdown[method] = { count: 0, total: 0 };
        }
        paymentBreakdown[method].count++;
        paymentBreakdown[method].total += order.total || order.totalAmount || 0;
    });

    return `
        <div class="stats-grid" style="margin-bottom:20px;">
            <div class="stat-card">
                <i class="fas fa-shopping-bag"></i>
                <h4>Total Orders</h4>
                <p>${reportOrders.length}</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-dollar-sign"></i>
                <h4>Total Revenue</h4>
                <p>MWK ${totalSales.toLocaleString()}</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-chart-line"></i>
                <h4>Avg Order</h4>
                <p>MWK ${reportOrders.length > 0 ? Math.round(totalSales / reportOrders.length).toLocaleString() : 0}</p>
            </div>
        </div>

        <h4 style="margin-bottom:10px;">Payment Method Breakdown</h4>
        <table class="report-table" style="margin-bottom:20px;">
            <thead>
                <tr>
                    <th>Method</th>
                    <th>Orders</th>
                    <th>Total Amount</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(paymentBreakdown).map(([method, data]) => `
                    <tr>
                        <td style="text-transform:capitalize;">${method}</td>
                        <td>${data.count}</td>
                        <td>MWK ${data.total.toLocaleString()}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <h4 style="margin-bottom:10px;">Transaction Details</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Order ID</th>
                    <th>Time</th>
                    <th>Customer/Staff</th>
                    <th>Amount</th>
                    <th>Payment</th>
                </tr>
            </thead>
            <tbody>
                ${reportOrders.map(order => `
                    <tr>
                        <td>${order.id || order.orderId || 'N/A'}</td>
                        <td>${new Date(order.date || order.orderDate).toLocaleTimeString()}</td>
                        <td>${order.customerName || order.staffName || 'N/A'}</td>
                        <td>MWK ${(order.total || order.totalAmount || 0).toLocaleString()}</td>
                        <td style="text-transform:capitalize;">${order.paymentMethod || 'cash'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function generateWeeklySalesReport(reportOrders, reportDate) {
    const dailyBreakdown = {};
    
    reportOrders.forEach(order => {
        const day = new Date(order.date || order.orderDate).toLocaleDateString();
        if (!dailyBreakdown[day]) {
            dailyBreakdown[day] = { count: 0, total: 0 };
        }
        dailyBreakdown[day].count++;
        dailyBreakdown[day].total += order.total || order.totalAmount || 0;
    });

    return `
        <h4 style="margin-bottom:10px;">Daily Breakdown</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(dailyBreakdown).map(([day, data]) => `
                    <tr>
                        <td>${day}</td>
                        <td>${data.count}</td>
                        <td>MWK ${data.total.toLocaleString()}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function generateMonthlySalesReport(reportOrders, reportDate) {
    const weeklyBreakdown = {};
    
    reportOrders.forEach(order => {
        const week = 'Week ' + Math.ceil(new Date(order.date || order.orderDate).getDate() / 7);
        if (!weeklyBreakdown[week]) {
            weeklyBreakdown[week] = { count: 0, total: 0 };
        }
        weeklyBreakdown[week].count++;
        weeklyBreakdown[week].total += order.total || order.totalAmount || 0;
    });

    return `
        <h4 style="margin-bottom:10px;">Weekly Breakdown</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Week</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(weeklyBreakdown).map(([week, data]) => `
                    <tr>
                        <td>${week}</td>
                        <td>${data.count}</td>
                        <td>MWK ${data.total.toLocaleString()}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function generateInventoryReport() {
    const lowStock = products.filter(p => p.stock <= p.lowStock && p.stock > 0);
    const outOfStock = products.filter(p => p.stock === 0);
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

    return `
        <div class="stats-grid" style="margin-bottom:20px;">
            <div class="stat-card">
                <i class="fas fa-boxes"></i>
                <h4>Total Products</h4>
                <p>${products.length}</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-exclamation-triangle"></i>
                <h4>Low Stock</h4>
                <p>${lowStock.length}</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-times-circle"></i>
                <h4>Out of Stock</h4>
                <p>${outOfStock.length}</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-dollar-sign"></i>
                <h4>Total Value</h4>
                <p>MWK ${totalValue.toLocaleString()}</p>
            </div>
        </div>

        ${lowStock.length > 0 ? `
            <h4 style="margin-bottom:10px; color:var(--warning-color);">Low Stock Items</h4>
            <table class="report-table" style="margin-bottom:20px;">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Current Stock</th>
                        <th>Reorder Level</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    ${lowStock.map(product => `
                        <tr style="color:var(--warning-color);">
                            <td>${product.name}</td>
                            <td>${product.stock}</td>
                            <td>${product.lowStock}</td>
                            <td>MWK ${(product.price * product.stock).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        ` : ''}

        ${outOfStock.length > 0 ? `
            <h4 style="margin-bottom:10px; color:var(--danger-color);">Out of Stock Items</h4>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Last Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${outOfStock.map(product => `
                        <tr style="color:var(--danger-color);">
                            <td>${product.name}</td>
                            <td>${product.category}</td>
                            <td>MWK ${product.price.toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        ` : ''}
    `;
}

function generateProductPerformanceReport(reportOrders) {
    const productSales = {};
    
    reportOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                const productName = item.name || item.productName;
                if (!productSales[productName]) {
                    productSales[productName] = { quantity: 0, revenue: 0 };
                }
                productSales[productName].quantity += item.quantity || 1;
                productSales[productName].revenue += item.price * (item.quantity || 1);
            });
        }
    });

    const sortedProducts = Object.entries(productSales)
        .sort(([,a], [,b]) => b.revenue - a.revenue)
        .slice(0, 20); // Top 20 products

    return `
        <h4 style="margin-bottom:10px;">Top Performing Products</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Quantity Sold</th>
                    <th>Revenue</th>
                    <th>Avg Price</th>
                </tr>
            </thead>
            <tbody>
                ${sortedProducts.map(([name, data]) => `
                    <tr>
                        <td>${name}</td>
                        <td>${data.quantity}</td>
                        <td>MWK ${data.revenue.toLocaleString()}</td>
                        <td>MWK ${Math.round(data.revenue / data.quantity).toLocaleString()}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function exportReport() {
    const reportType = $('#reportType').val() || 'daily';
    exportToPDF(reportType);
}

function exportToPDF(reportType) {
    const output = $('#reportOutput');
    if (!output.length || output.html().trim() === '') {
        showToast('Generate report first', 'warning');
        return;
    }

    // Check if html2pdf library is loaded
    if (typeof html2pdf === 'undefined') {
        // Fallback: create a simple text export
        const reportText = output.text();
        const blob = new Blob([reportText], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        window.URL.revokeObjectURL(url);
        showToast('Report exported as text file', 'success');
    } else {
        const element = output.clone()[0];
        const opt = {
            margin: 10,
            filename: `${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
        };
        
        html2pdf().set(opt).from(element).save();
        showToast('Report exported to PDF', 'success');
    }
}

function exportToExcel(reportType) {
    const output = $('#reportOutput');
    if (!output.length || output.html().trim() === '') {
        showToast('Generate report first', 'warning');
        return;
    }

    // Simple CSV export
    const tables = output.find('table');
    let csvContent = '';
    
    tables.each(function() {
        const table = $(this);
        table.find('tr').each(function() {
            const row = [];
            $(this).find('th, td').each(function() {
                row.push('"' + $(this).text().replace(/"/g, '""') + '"');
            });
            csvContent += row.join(',') + '\n';
        });
        csvContent += '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('Report exported to Excel (CSV)', 'success');
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