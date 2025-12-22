
# PayPal API Web App

A modern, responsive web application that simulates PayPal payment processing and user interactions using a PayPal-like API interface. This project demonstrates how to integrate with the PayPal REST API for payment authentication, processing, and transaction status display in a user-friendly interface.


## API Details Used
- **PayPal REST API** (simulated or real)
	- OAuth 2.0 authentication for secure payment processing
	- Endpoints for creating and executing payments
	- Fetching transaction details and payment status
	- [PayPal API Docs](https://developer.paypal.com/docs/api/overview/)

## Features
- Simulated PayPal OAuth 2.0 authentication
- Process payments and view transaction status
- Responsive, card-based UI
- Error handling and loading indicators


## Screenshots
![App Screenshot](screenshot.png)


## Instructions to Run the Project

### Prerequisites
- PayPal Developer account (for real API integration)
- PayPal App credentials (Client ID, Secret) if connecting to real API
- Modern web browser

### Installation & Running
1. Clone this repository:
	```sh
	git clone https://github.com/yourusername/paypal-api-webapp.git
	cd paypal-api-webapp
	```
2. Configure your PayPal App credentials in `config.js` (use placeholders for public repos):
	```js
	const PAYPAL_CONFIG = {
	  CLIENT_ID: 'YOUR_CLIENT_ID',
	  SECRET: 'YOUR_SECRET',
	  API_BASE: 'https://api.sandbox.paypal.com'
	};
	```
3. Open `index.html` in your browser to launch the app.


## Usage
- Enter payment details and click "Pay with PayPal".
- Authenticate via PayPal if prompted.
- View payment status and transaction details in the UI.


## Technologies Used
- HTML5, CSS3 (Flexbox/Grid), JavaScript (ES6+)
- PayPal REST API (simulated or real)


## Project Structure
```
├── index.html
├── style.css
├── script.js
├── config.js
├── README.md
```

## Security
- API keys and tokens are not committed to the repository. Use placeholders in public code.

## Members & Role Assignment

Each member has been assigned two roles to ensure clear responsibilities:

| Name         | Roles                                      |
|--------------|---------------------------------------------|
| Member 1     | API & Authentication Handler, UI & CSS Designer |
| Member 2     | JavaScript Logic / Data Processing, GitHub & Documentation Manager |
| Member 3     | API & Authentication Handler, JavaScript Logic / Data Processing |

Roles:
- API & Authentication Handler
- JavaScript Logic / Data Processing
- UI & CSS Designer
- GitHub & Documentation Manager

## License
This project is licensed under the MIT License.

## Credits
- PayPal Developer Docs: https://developer.paypal.com/docs/api/overview/
- UI inspired by PayPal
