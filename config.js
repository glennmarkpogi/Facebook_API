// Facebook Graph API configuration
// Replace placeholders with your actual values, but DO NOT commit real secrets
const FB_CONFIG = {
    APP_ID: "1759584764710210",
    REDIRECT_URI: "http://localhost:5500/",
    API_VERSION: "v24.0",
    // Add more config as needed
};

// Access token will be set after OAuth login
let ACCESS_TOKEN = null;
