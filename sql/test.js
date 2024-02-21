const db = require('../db'); // Ensure this is your promise-based connection module

async function cleanCardSetNames() {
    try {
        // Fetch all CardCopy entries
        const cards = await db.query('SELECT CardID, CardSet, CardColor, CardVariant FROM CardCopy');

        // Loop through each card and update CardSet
        for (const card of cards) {
            let { CardID, CardSet, CardColor, CardVariant } = card;
            // Ensure CardColor and CardVariant are not null or empty strings
            CardColor = CardColor || '';
            CardVariant = CardVariant || '';

            // Split CardColor and CardVariant by spaces to handle multiple words/colors
            const colors = CardColor.split(' ');
            const variants = CardVariant.split(' ');

            // Remove all occurrences of each color and variant from CardSet
            [...colors, ...variants].forEach(word => {
                if (word) {
                    const regex = new RegExp(`\\b${word}\\b`, 'gi'); // Match whole word, case-insensitive
                    CardSet = CardSet.replace(regex, '').trim();
                }
            });

            // Update the CardCopy table with the cleaned CardSet
            await db.query('UPDATE CardCopy SET CardSet = ? WHERE CardID = ?', [CardSet, CardID]);
        }

        console.log('CardSet names in CardCopy table cleaned successfully.');
    } catch (error) {
        console.error('Failed to clean CardSet names in the CardCopy table:', error);
    }
}

// Execute the cleaning function
cleanCardSetNames();
