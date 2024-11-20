const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const pool = require('./config/db');

const app = express();
const port = process.env.PORT || 3001;

// JSON 본문 파싱 미들웨어 추가
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 파일 저장 위치 및 이름 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// 파일 필터 설정
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(new Error('Only .png files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});

// 정적 파일 서빙을 위한 설정
app.use(express.static(path.join(__dirname, 'controllers', 'user')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 회원가입 페이지
app.get('/join', (req, res) => {
    res.sendFile(path.join(__dirname, 'controllers', 'user', 'join.html'));
});

// 로그인 페이지
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'controllers', 'user', 'login.html'));
});

// 루트 페이지
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// 회원가입 라우트 (POST /join)
app.post('/join', upload.single('profile_image'), async (req, res) => {
    const { username, email, password, name, phone_number, birth_date, role } = req.body;
    let profile_image = req.file ? req.file.path : null;

    if (profile_image) {
        const outputPath = profile_image.replace(path.extname(profile_image), '-processed.png');

        try {
            // Check if the file exists and is readable
            await fs.promises.access(profile_image, fs.constants.F_OK | fs.constants.R_OK);

            // Process the image
            await sharp(profile_image)
                .resize(800) // Adjust size as needed
                .toFile(outputPath);

            fs.unlinkSync(profile_image); // Remove the original file
            profile_image = outputPath;

            console.log('Image processed and saved to:', outputPath);
        } catch (err) {
            console.error('Error processing image:', err);
            return res.status(500).json({ message: 'Error processing image' });
        }
    }

    try {
        const password_hash = await bcrypt.hash(password, 10);
        const query = `INSERT INTO users (username, email, password_hash, name, phone_number, birth_date, profile_image, role)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        const [result] = await pool.execute(query, [username, email, password_hash, name, phone_number, birth_date, profile_image, role]);
        res.status(200).json({ message: 'User successfully created!' });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ message: 'Database error occurred' });
    }
});

// 로그인 라우트 (POST /login)
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const query = `SELECT * FROM users WHERE email = ?`;
        const [rows] = await pool.execute(query, [email]);

        if (rows.length === 0) {
            return res.status(400).json({ message: 'User not found' });
        }

        const user = rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(400).json({ message: 'Incorrect password' });
        }

        res.json({
            message: 'Login successful',
            user: {
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});