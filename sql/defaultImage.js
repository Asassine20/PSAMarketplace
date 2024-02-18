const db = require('../db'); // Replace './db' with your database connection module path

async function setDefaultImageForCards() {
    const query = "UPDATE Card SET CardImage = '/images/defaultPSAImage.png'";

    try {
        const result = await db.query(query);
        console.log('Number of records updated:', result.affectedRows);
    } catch (error) {
        console.error('Error setting default image for cards:', error);
    }
}

setDefaultImageForCards();
