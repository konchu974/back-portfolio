require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;

const rateLimit = require('express-rate-limit');



// Middleware
app.use(cors());
app.use(express.json()); // Pour parser le JSON dans les requêtes POST
app.use('/images', express.static(path.join(__dirname, 'images')));

const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Maximum 5 requêtes par IP
    message: { error: "Trop de messages envoyés. Réessayez dans 15 minutes." },
    headers: true, // Pour inclure les headers de limite dans la réponse
});

// === Route pour envoyer un email ===
app.post('/api/send-email', contactLimiter, async (req, res) => {
    const { name, email, message } = req.body;

    // Vérification basique
    if (!name || !email || !message) {
        return res.status(400).json({ error: "Tous les champs sont requis." });
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: email,
        to: process.env.EMAIL_TO,
        subject: `Nouveau message de ${name}`,
        text: `
Nom : ${name}
Email : ${email}
Message : ${message}
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: "Email envoyé avec succès !" });
    } catch (error) {
        console.error("Erreur lors de l'envoi de l'email :", error);
        res.status(500).json({ error: "Échec de l'envoi du message." });
    }
});

// === Routes existantes ===
app.get('/api/albums', (req, res) => {
    fs.readFile(path.join(__dirname, 'albums.json'), 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading albums data:', err);
            return res.status(500).send('Error reading albums data');
        }
        res.json(JSON.parse(data));
    });
});

app.get('/api/skills', (req, res) => {
    fs.readFile(path.join(__dirname, 'skills.json'), 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading skills data:', err);
            return res.status(500).send('Error reading skills data');
        }
        res.json(JSON.parse(data));
    });
});

app.get('/api/projects', (req, res) => {
    fs.readFile(path.join(__dirname, 'projects.json'), 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading projects data:', err);
            return res.status(500).send('Error reading projects data');
        }
        res.json(JSON.parse(data));
    });
});

// Lancer le serveur
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});