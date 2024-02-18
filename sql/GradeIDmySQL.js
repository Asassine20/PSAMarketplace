const db = require('./db'); // Assuming 'db' is your database connection module

async function populateGrades() {
    try {
        // Fetch all CardIDs
        const cards = await db.query('SELECT CardID FROM Card');
        
        // Prepare to insert grades for each card
        for (const card of cards) {
            for (let grade = 1; grade <= 10; grade++) {
                await db.query('INSERT INTO Grade (CardID, GradeValue) VALUES (?, ?)', [card.CardID, grade]);
            }
        }

        console.log('All grades populated successfully.');
    } catch (error) {
        console.error('Error populating grades:', error);
    }
}

populateGrades();
