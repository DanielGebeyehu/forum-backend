# Deployment Guide

This guide will help you deploy the Evangadi Forum project using Supabase, Railway, and Netlify.

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Railway Account**: Sign up at [railway.app](https://railway.app)
3. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
4. **GitHub Repository**: Push your code to GitHub

## Backend Deployment (Railway + Supabase)

### 1. Set up Supabase Database

1. Create a new project in Supabase
2. Go to Settings > API to get your project URL and API keys
3. Note down:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 2. Deploy to Railway

1. Connect your GitHub repository to Railway
2. Select the `Server` folder as the root directory
3. Add the following environment variables in Railway:
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SENDGRID_API_KEY=your_sendgrid_api_key
   EMAIL_USER=your_email@gmail.com
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=production
   FRONTEND_URL=https://your-netlify-app.netlify.app
   ```
4. Deploy the application
5. Note the Railway app URL (e.g., `https://your-app.railway.app`)

### 3. Set up Supabase Database Tables

**Option 1: Using Supabase Dashboard (Recommended)**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the following SQL to create tables:

```sql
CREATE TABLE IF NOT EXISTS users (
  userid SERIAL PRIMARY KEY,
  username VARCHAR(20) NOT NULL UNIQUE,
  firstname VARCHAR(20) NOT NULL,
  lastname VARCHAR(20) NOT NULL,
  email VARCHAR(40) NOT NULL UNIQUE,
  user_password VARCHAR(100) NOT NULL,
  reset_otp VARCHAR(6),
  otp_expiration TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  questionid VARCHAR(100) NOT NULL UNIQUE,
  userid INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  title VARCHAR(255) NOT NULL,
  tag VARCHAR(50),
  description TEXT NOT NULL,
  is_deleted SMALLINT DEFAULT 0,
  FOREIGN KEY (userid) REFERENCES users(userid)
);

CREATE TABLE IF NOT EXISTS answers (
  answerid SERIAL PRIMARY KEY,
  userid INT NOT NULL,
  questionid VARCHAR(100) NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_deleted SMALLINT DEFAULT 0,
  FOREIGN KEY (questionid) REFERENCES questions(questionid),
  FOREIGN KEY (userid) REFERENCES users(userid)
);
```

**Option 2: Using Create Tables Script**
Run the create tables script locally:
```bash
cd Server
node createTables.js
```

## Frontend Deployment (Netlify)

### 1. Deploy to Netlify

1. Connect your GitHub repository to Netlify
2. Set the build settings:
   - **Base directory**: `Client`
   - **Build command**: `npm run build`
   - **Publish directory**: `Client/dist`
3. Add environment variable:
   ```
   VITE_API_URL=https://your-actual-railway-app.railway.app/api
   ```
   (Replace `your-actual-railway-app` with your real Railway app name)
4. Deploy the application

### 2. Update CORS Settings

Update the CORS origins in your Railway backend to include your Netlify domain:
```javascript
origin: [
  "http://localhost:5173",
  "http://localhost:5174", 
  "http://localhost:5175",
  "https://your-netlify-app.netlify.app"
]
```

## Environment Variables Summary

### Backend (Railway)
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SENDGRID_API_KEY`: Your SendGrid API key (for email functionality)
- `EMAIL_USER`: Your email address (for SendGrid)
- `JWT_SECRET`: A random secret string for JWT tokens
- `NODE_ENV`: Set to `production`
- `FRONTEND_URL`: Your Netlify frontend URL (for CORS)

### Frontend (Netlify)
- `VITE_API_URL`: Your Railway backend URL + `/api`

## Testing the Deployment

1. **Backend Health Check**: Visit `https://your-railway-app.railway.app/api/health`
2. **Frontend**: Visit your Netlify URL
3. **Database**: Check Supabase dashboard for tables and data

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure your Netlify URL is added to the CORS origins in your backend
2. **Database Connection**: Verify your Supabase credentials are correct
3. **Build Failures**: Check that all dependencies are installed and environment variables are set

### Useful Commands

```bash

cd Server
npm start


cd Client
npm run dev

railway logs

- Never commit `.env` files to version control
- Use strong, unique JWT secrets
- Regularly rotate your API keys
- Monitor your Railway and Netlify usage
