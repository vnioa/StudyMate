const express = require('express');
const axios = require('axios');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const port = 3006;

// MySQL database connection
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Naver API URLs
const tokenUrl = "https://nid.naver.com/oauth2.0/token";
const userInfoUrl = "https://openapi.naver.com/v1/nid/me";

// Naver Login Callback
app.get('/auth/naver-login', async (req, res) => {
    const requestCode = req.query.code;

    if (!requestCode) {
        return res.status(400).send('No authorization code provided');
    }

    try {
        // Request access token
        const tokenResponse = await axios.post(tokenUrl, null, {
            params: {
                grant_type: 'authorization_code',
                client_id: process.env.NAVER_CLIENT_ID, // 환경변수에서 클라이언트 ID 가져오기
                client_secret: process.env.NAVER_CLIENT_SECRET, // 환경변수에서 클라이언트 비밀번호 가져오기
                code: requestCode,
                redirect_uri: process.env.NAVER_REDIRECT_URI, // 환경변수에서 리다이렉트 URI 가져오기
            }
        });

        const accessToken = tokenResponse.data.access_token;

        // Get user information
        const userResponse = await axios.get(userInfoUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const user = userResponse.data.response;
        console.log('User data:', user);

        const { id, nickname, email, profile_image } = user;

        // Log the extracted data before running the query
        console.log('Extracted user data:', { id, nickname, email, profile_image });

        // MySQL query to insert user data
        const query = `
            INSERT INTO users (username, email, password_hash, name, profile_image, role)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                username = VALUES(username),
                email = VALUES(email),
                name = VALUES(name),
                profile_image = VALUES(profile_image),
                role = VALUES(role),
                updated_at = CURRENT_TIMESTAMP;
        `;

        // Use a function to handle the query and pass res
        connection.query(query, [
            nickname, 
            email, 
            '',  // Naver login does not use a password hash
            nickname, 
            profile_image,
            'user'  // Default user role
        ], (err, results) => {
            if (err) {
                console.error('Database query error:', err);
                return res.status(500).send('Error saving user data');
            }

            console.log('User data saved to DB:', results);
            res.status(200).send({ message: 'User authenticated and saved to database', user });
        });

    } catch (error) {
        console.error('Error during Naver login:', error);
        res.status(500).send('Error during Naver login');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
