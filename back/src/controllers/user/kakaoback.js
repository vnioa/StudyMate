const express = require('express');
const axios = require('axios');
const mysql = require('mysql2');
require('dotenv').config(); // Load environment variables

const app = express();
const port = 3004;

// MySQL database connection using environment variables
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Kakao API URLs
const tokenUrl = "https://kauth.kakao.com/oauth/token";
const userInfoUrl = "https://kapi.kakao.com/v2/user/me";

// Kakao Login Callback
app.get('/auth/kakao-login', async (req, res) => {
    const requestCode = req.query.code;

    if (!requestCode) {
        return res.status(400).send('No authorization code provided');
    }

    try {
        // Request access token
        const tokenResponse = await axios.post(tokenUrl, null, {
            params: {
                grant_type: 'authorization_code',
                client_id: process.env.KAKAO_CLIENT_ID, // 환경변수에서 클라이언트 ID 가져오기
                redirect_uri: process.env.KAKAO_REDIRECT_URI, // 환경변수에서 리다이렉트 URI 가져오기
                code: requestCode,
            }
        });

        const accessToken = tokenResponse.data.access_token;

        // Get user information
        const userResponse = await axios.get(userInfoUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const user = userResponse.data;
        console.log('User data:', user);

        const { id, properties, kakao_account } = user;
        const username = properties.nickname;
        const email = kakao_account.email || null; // 이메일이 없을 수 있으므로 기본값 설정
        const name = properties.nickname;
        const profile_image = properties.profile_image;

        // Log the extracted data before running the query
        console.log('Extracted user data:', { username, email, name, profile_image });

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

        connection.query(query, [
            username,
            email,
            '',  // Kakao login does not use a password hash
            name,
            profile_image,
            'user',  // Default user role
        ], (err, results) => {
            if (err) {
                console.error('Database query error:', err);
                return res.status(500).send('Error saving user data');
            }

            console.log('User data saved to DB:', results);
            res.status(200).send({ message: 'User authenticated and saved to database', user });
        });

    } catch (error) {
        console.error('Error during Kakao login:', error);
        res.status(500).send('Error during Kakao login');
    }
});

// Error handling function
const handleError = (res, error) => {
    if (!res.headersSent) { // 응답이 이미 전송되지 않았다면
        res.status(500).json({ error: error.message });
    }
};

// Example endpoint
app.get('/some-endpoint', (req, res) => {
    connection.query('SELECT * FROM users', (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            handleError(res, err); // 오류 처리 후 응답 보내기
            return; // 나머지 코드 실행을 막음
        }

        res.json(results); // 정상적으로 데이터를 반환
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
