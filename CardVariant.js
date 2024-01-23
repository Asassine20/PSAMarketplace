const db = require('./db'); // Replace './db' with your database connection module path

async function updateCardVariants() {
    try {
        // Define the variants to search for
        const variants = ['base', 'patch', 'serial', 'memorabilia','variation','short print', 'draft picks' , 'parallel', 'insert', 'retail', 'refractor', 'xfractors', 'mini', 
                        'press proof', 'autograph','holo', 'fire burst', 'rookie', 'camo', 'lazer', 'velocity', 'reactive', 'die cut', 
                        'pulsar', 'disco','sticker', 'shock' ];

        // Fetch all cards
        const cards = await db.query('SELECT CardID, CardSet FROM Card');

        // Iterate through each card and update the variant if it matches
        for (const card of cards) {
            for (const variant of variants) {
                if (card.CardSet.toLowerCase().includes(variant)) {
                    await db.query('UPDATE Card SET CardVariant = ? WHERE CardID = ?', [variant, card.CardID]);
                    break; // Break out of the variant loop once a match is found
                }
            }
        }

        console.log('Card variants updated successfully.');
    } catch (error) {
        console.error('Error updating card variants:', error);
    }
}

// Run the function
updateCardVariants();
