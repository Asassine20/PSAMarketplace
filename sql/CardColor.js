const db = require('../db'); // Replace './db' with your database connection module path

async function updateCardColors() {
    try {
        // Define the colors to search for
        const colors = ['Gold', 'Red', 'Blue', 'Black', 'Cyan', 'Green', 'Purple', 'Silver', 'Orange', 'Platinum', 'Pink',
      'Emerald', 'Bronze', 'Yellow', 'Ruby', 'Sapphire', 'Rainbow', 'Copper', 'White', 'Tiffany', 'Magenta', 'Aqua', 'Sepia', 'Black and White',
    'Red White & Blue', 'Wood', 'Onyx', 'Clear', 'Cosmic', 'Neon', 'Diamond', 'Padparadscha', 'Tie-Dye', 'Lava', 'Nebula', 'Asia', 'Galactic' ];

        // Fetch all cards excluding specific CardSport values
        const cards = await db.query("SELECT CardID, CardSet FROM Card WHERE Sport NOT IN ('Pokemon (English)', 'Pokemon (Japan)')");

        // Iterate through each card and update the color if it matches
        for (const card of cards) {
            if (card.CardSet && colors.some(color => card.CardSet.toLowerCase().includes(color.toLowerCase()))) {
                // If CardSet is not null and includes any color
                for (const color of colors) {
                    if (card.CardSet.toLowerCase().includes(color.toLowerCase())) {
                        await db.query('UPDATE Card SET CardColor = ? WHERE CardID = ?', [color, card.CardID]);
                        break; // Break out of the color loop once a match is found
                    }
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

