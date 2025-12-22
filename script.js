import { PAYPAL_BASE_URL, CLIENT_ID, SECRET } from "./config.js";

// Product Database
const products = [
    {
        id: 1,
        name: "Dell XPS 15",
        description: "15.6\" FHD, Intel i7, 16GB RAM, 512GB SSD",
        price: 85.99,
        image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&h=300&fit=crop",
        stock: 15
    },
    {
        id: 2,
        name: "MacBook Pro 14\"",
        description: "M2 Pro chip, 16GB RAM, 1TB SSD, Space Gray",
        price: 95.50,
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop",
        stock: 8
    },
    {
        id: 3,
        name: "HP Pavilion Gaming",
        description: "15.6\" FHD, Ryzen 5, RTX 3050, 16GB RAM",
        price: 65.75,
        image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=300&fit=crop",
        stock: 12
    },
    {
        id: 4,
        name: "ASUS ROG Strix",
        description: "17.3\" QHD, Intel i9, RTX 4070, 32GB RAM",
        price: 99.00,
        image: "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400&h=300&fit=crop",
        stock: 5
    },
    {
        id: 5,
        name: "Lenovo ThinkPad X1",
        description: "14\" FHD, Intel i7, 16GB RAM, 512GB SSD",
        price: 78.25,
        image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&h=300&fit=crop",
        stock: 20
    },
    {
        id: 6,
        name: "Acer Predator Helios",
        description: "15.6\" QHD, Intel i7, RTX 3060, 16GB RAM",
        price: 89.99,
        image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=300&fit=crop",
        stock: 10
    }
];

// Shopping Cart
let cart = [];

// Currency conversion (1 USD = 56 PHP)
const PHP_TO_USD_RATE = 56;

// DOM Elements
const productsGrid = document.getElementById("products");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const loadingEl = document.getElementById("loading");
const errorContainer = document.getElementById("errorContainer");
const successContainer = document.getElementById("successContainer");
const cartSummary = document.getElementById("cartSummary");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");
const clearCartBtn = document.getElementById("clearCartBtn");
const purchaseHistorySection = document.getElementById("purchaseHistory");
const historyItems = document.getElementById("historyItems");

// Purchase history (persisted in localStorage)
let purchaseHistory = [];

// Initialize App
function init() {
    displayProducts(products);
    setupEventListeners();
    loadPurchaseHistory();
    handlePayPalReturn();
}

function getBaseReturnUrl() {
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    return url.toString();
}

// If PayPal redirects back with ?token=ORDER_ID, capture it and show result.
async function handlePayPalReturn() {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("token");

    if (!orderId) return;

    // Save a snapshot of the cart before clearing
    const cartSnapshot = JSON.parse(localStorage.getItem("cart_snapshot")) || [];

    try {
        showLoading();

        const capture = await captureOrder(orderId);

        hideLoading();

        const status = capture?.status || "UNKNOWN";
        if (status === "COMPLETED") {
            showSuccess(`Payment completed! Order ID: ${orderId} (Status: ${status})`);
            if (cartSnapshot.length > 0) {
                addToPurchaseHistory(orderId, cartSnapshot);
            }
            clearCart();
        } else {
            showError(`Payment returned but not completed. Order ID: ${orderId} (Status: ${status})`);
        }
    } catch (error) {
        hideLoading();
        showError(`Could not capture payment. ${error.message}`);
    } finally {
        // Clean URL so refreshing doesn't re-capture.
        const baseUrl = getBaseReturnUrl();
        window.history.replaceState({}, document.title, baseUrl);
        // Remove cart snapshot
        localStorage.removeItem("cart_snapshot");
    }
}

// Save purchase to history
function addToPurchaseHistory(orderId, items) {
    const now = new Date();
    const total = items.reduce((sum, item) => sum + item.price, 0);
    purchaseHistory.unshift({
        orderId,
        date: now.toLocaleString(),
        items,
        total
    });
    // Save to localStorage
    localStorage.setItem("purchase_history", JSON.stringify(purchaseHistory));
    renderPurchaseHistory();
}

function loadPurchaseHistory() {
    const data = localStorage.getItem("purchase_history");
    if (data) {
        purchaseHistory = JSON.parse(data);
        renderPurchaseHistory();
    }
}

function renderPurchaseHistory() {
    if (!purchaseHistory.length) {
        purchaseHistorySection.classList.add("hidden");
        return;
    }
    purchaseHistorySection.classList.remove("hidden");
    historyItems.innerHTML = purchaseHistory.map(order => `
        <div class="history-order">
            <div class="history-title">Order ID: <span style="color:#333">${order.orderId}</span> <span style="font-size:0.9em;color:#888;">(${order.date})</span></div>
            <ul class="history-list">
                ${order.items.map(item => `<li>${item.name} <span style='color:#0070ba'>(₱${item.price.toFixed(2)})</span></li>`).join("")}
            </ul>
            <div class="history-total">Total: <strong>₱${order.total.toFixed(2)}</strong></div>
        </div>
    `).join("");
}

// Setup Event Listeners
function setupEventListeners() {
    searchBtn.addEventListener("click", handleSearch);
    searchInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter") handleSearch();
    });
    checkoutBtn.addEventListener("click", handleCheckout);
    clearCartBtn.addEventListener("click", clearCart);
}

// Display Products
function displayProducts(productList) {
    productsGrid.innerHTML = "";
    
    if (productList.length === 0) {
        productsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: white; border-radius: 12px;">
                <h3>No products found</h3>
                <p style="color: #666; margin-top: 10px;">Try a different search term</p>
            </div>
        `;
        return;
    }

    productList.forEach(product => {
        const card = createProductCard(product);
        productsGrid.appendChild(card);
    });
}

// Create Product Card
function createProductCard(product) {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/400x300?text=${encodeURIComponent(product.name)}'">
        <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <p class="product-description">${product.description}</p>
            <div class="product-price">₱${product.price.toFixed(2)}</div>
            <p class="product-stock">In Stock: ${product.stock} units</p>
            <button class="btn btn-add" onclick="addToCart(${product.id})">Add to Cart</button>
        </div>
    `;
    return card;
}

// Add to Cart
window.addToCart = function(productId) {
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        showError("Product not found");
        return;
    }

    // Check if already in cart
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        showError("Product already in cart");
        return;
    }

    cart.push({ ...product });
    updateCartDisplay();
    showSuccess(`${product.name} added to cart!`);
};

// Remove from Cart
window.removeFromCart = function(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
    showSuccess("Item removed from cart");
};

// Update Cart Display
function updateCartDisplay() {
    if (cart.length === 0) {
        cartSummary.classList.add("hidden");
        return;
    }

    cartSummary.classList.remove("hidden");
    cartItems.innerHTML = "";
    
    let total = 0;
    cart.forEach(item => {
        total += item.price;
        
        const cartItem = document.createElement("div");
        cartItem.className = "cart-item";
        cartItem.innerHTML = `
            <span class="cart-item-name">${item.name}</span>
            <span class="cart-item-price">₱${item.price.toFixed(2)}</span>
            <button class="remove-item" onclick="removeFromCart(${item.id})">Remove</button>
        `;
        cartItems.appendChild(cartItem);
    });

    cartTotal.textContent = `₱${total.toFixed(2)}`;
}

// Clear Cart
function clearCart() {
    cart = [];
    updateCartDisplay();
    showSuccess("Cart cleared");
}

// Handle Search
function handleSearch() {
    const query = searchInput.value.trim().toLowerCase();
    
    if (!query) {
        displayProducts(products);
        return;
    }

    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
    );

    displayProducts(filtered);
}

// Handle Checkout
async function handleCheckout() {
    // Validation
    if (cart.length === 0) {
        showError("Your cart is empty. Please add items before checkout.");
        return;
    }

    const total = cart.reduce((sum, item) => sum + item.price, 0);

    if (total <= 0) {
        showError("Invalid cart total");
        return;
    }

    // Convert PHP to USD for PayPal (PayPal Sandbox primarily uses USD)
    const totalInUSD = (total / PHP_TO_USD_RATE).toFixed(2);

    try {
        showLoading();
        disableButton(checkoutBtn);

        // Save a snapshot of the cart before redirecting to PayPal
        localStorage.setItem("cart_snapshot", JSON.stringify(cart));

        // Create PayPal Order (in USD)
        const order = await createOrder(totalInUSD, total.toFixed(2));

        hideLoading();

        if (order && order.id) {
            // Find approve link
            const approveLink = order.links?.find(link => link.rel === "approve");
            
            if (approveLink) {
                showSuccess(`Order created! Order ID: ${order.id}`);
                
                // Create redirect button
                const redirectMsg = document.createElement("div");
                redirectMsg.style.cssText = "background: white; padding: 20px; border-radius: 12px; margin-top: 20px; text-align: center;";
                redirectMsg.innerHTML = `
                    <h3 style="color: #0070ba; margin-bottom: 15px;">Ready to Pay!</h3>
                    <p style="margin-bottom: 10px;">Order Status: <strong>${order.status}</strong></p>
                    <p style="margin-bottom: 15px; font-size: 0.9rem; color: #666;">Total: ₱${total.toFixed(2)} PHP (≈ $${totalInUSD} USD)</p>
                    <a href="${approveLink.href}" class="btn btn-primary" style="display: inline-block; text-decoration: none;">
                        Complete Payment on PayPal
                    </a>
                    <p style="margin-top: 15px; font-size: 0.9rem; color: #666;">
                        Click the button above to approve payment in PayPal Sandbox
                    </p>
                `;
                
                successContainer.appendChild(redirectMsg);
            } else {
                showError("Approve link not found in order response");
            }
        } else {
            showError("Failed to create order. Please try again.");
        }

    } catch (error) {
        hideLoading();
        showError(`Checkout failed: ${error.message}`);
    } finally {
        enableButton(checkoutBtn);
    }
}

// Get Access Token
async function getAccessToken() {
    const credentials = btoa(`${CLIENT_ID}:${SECRET}`);
    
    const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            "Authorization": `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "grant_type=client_credentials"
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error_description || "Authentication failed");
    }

    const data = await response.json();
    return data.access_token;
}

// Create PayPal Order
async function createOrder(totalUSD, totalPHP) {

    const token = await getAccessToken();
    const returnUrl = getBaseReturnUrl();
    const cancelUrl = getBaseReturnUrl();

    // Build item details for PayPal
    const items = cart.map(item => ({
        name: item.name,
        unit_amount: {
            currency_code: "USD",
            value: (item.price / PHP_TO_USD_RATE).toFixed(2)
        },
        quantity: "1",
        description: item.description
    }));

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            intent: "CAPTURE",
            application_context: {
                return_url: returnUrl,
                cancel_url: cancelUrl,
                user_action: "PAY_NOW"
            },
            purchase_units: [{
                amount: {
                    currency_code: "USD",
                    value: totalUSD,
                    breakdown: {
                        item_total: {
                            currency_code: "USD",
                            value: totalUSD
                        }
                    }
                },
                description: `Gadget Shop - ${cart.length} item(s) (₱${totalPHP} PHP)`,
                items
            }]
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    return response.json();
}

// Capture PayPal Order (finalizes payment after approval)
async function captureOrder(orderId) {
    const token = await getAccessToken();

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || `Capture API Error: ${response.status}`);
    }

    return response.json();
}

// UI Helper Functions
function showLoading() {
    loadingEl.classList.remove("hidden");
}

function hideLoading() {
    loadingEl.classList.add("hidden");
}

function showError(message) {
    errorContainer.textContent = `❌ ${message}`;
    errorContainer.classList.remove("hidden");
    
    setTimeout(() => {
        errorContainer.classList.add("hidden");
    }, 5000);
}

function showSuccess(message) {
    successContainer.innerHTML = `✅ ${message}`;
    successContainer.classList.remove("hidden");
    
    setTimeout(() => {
        if (!successContainer.querySelector("div")) {
            successContainer.classList.add("hidden");
        }
    }, 5000);
}

function disableButton(btn) {
    btn.disabled = true;
}

function enableButton(btn) {
    btn.disabled = false;
}

// Initialize on Load
init();
