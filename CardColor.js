const db = require('./db'); // Replace './db' with your database connection module path

async function updateCardColors() {
    try {
        // Define the colors to search for
        const colors = ['red white & blue', 'red white and blue', 'sky blue', 'black and white', 'lime green', 'gold', 'blue', 'silver', 'green', 
                        'red', 'chrome', 'glossy', 'rainbow', 'purple', 'pink', 'black', 'bronze', 'tiffany', 'orange', 
                        'yellow', 'copper', 'emerald', 'sepia', 'platinum', 'ruby', 'teal', 'sapphire', 'white', 'wood', 'grey', 'neon', 'aqua',
                        ''  ];

        // Fetch all cards
        const cards = await db.query('SELECT CardID, CardSet FROM Card');

        // Iterate through each card and update the color if it matches
        for (const card of cards) {
            for (const color of colors) {
                if (card.CardSet.toLowerCase().includes(color)) {
                    await db.query('UPDATE Card SET CardColor = ? WHERE CardID = ?', [color, card.CardID]);
                    break; // Break out of the color loop once a match is found
                }
            }
        }

        console.log('Card colors updated successfully.');
    } catch (error) {
        console.error('Error updating card colors:', error);
    }
}

// Run the function
updateCardColors();
