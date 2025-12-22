# Facebook Graph API Web App

## Project Description
A modern, responsive web application that allows users to authenticate with Facebook and view their profile, friends, posts, and likes using the Facebook Graph API. The app features a clean UI, dynamic data display, and robust error handling.

## API Details Used
- **Base URL:** `https://graph.facebook.com/v24.0/`
- **Endpoints:**
  - `/me` — Fetches the authenticated user's profile information
  - `/me/friends` — Retrieves the user's friends list
  - `/me/posts` — Gets the user's posts (with images, text, and dates)
  - `/me/likes` — Lists the pages the user has liked
- **Authentication:** OAuth 2.0 (user login and access token)
- **Required Permissions:** `user_friends`, `user_posts`, `user_likes`

## Instructions to Run the Project
1. **Clone this repository:**
   ```sh
   git clone https://github.com/glennmarkpogi/Facebook_API.git
   cd Facebook_API
   ```
2. **Configure Facebook App credentials:**
   - Open `script.js` and set your Facebook App ID and Redirect URI:
     ```js
     const FB_CONFIG = {
       APP_ID: 'YOUR_APP_ID',
       REDIRECT_URI: 'YOUR_REDIRECT_URI',
       API_VERSION: 'v24.0'
     };
     ```
3. **Open the app:**
   - Open `index.html` in your browser.
4. **Usage:**
   - Enter your Facebook username or ID and click "Search".
   - Authenticate via Facebook if prompted.
   - View your profile, friends, posts, and likes in the UI.

## Screenshots
### Main Dashboard
![App Screenshot](screenshot.png)

### Example: User Posts
![User Posts Screenshot](user-posts.png)

## Members & Roles
- **Glenn Mark Jimenez** — Lead Developer, UI/UX
- **Zed Lee** — API Integration, Testing
- *(Add more members and roles as needed)*

## Technologies Used
- HTML5, CSS3 (Flexbox/Grid), JavaScript (ES6+)
- Facebook Graph API v24.0

## Project Structure
```
├── index.html
├── style.css
├── script.js
├── README.md
```

## Security
- API keys and tokens are not committed to the repository. Use placeholders in public code.

## License
This project is licensed under the MIT License.

## Credits
- Facebook Graph API: https://developers.facebook.com/docs/graph-api
- UI inspired by Facebook


