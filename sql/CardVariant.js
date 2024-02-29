const db = require('../db'); // Replace './db' with your database connection module path

async function updateCardVariants() {
    try {
        // Define the variants to search for
        const variants = ['Base', 'Patch', 'Serial', 'Autograph', 'Memorabilia', 'Variation', 'Short Print', 'Draft Picks', 'Parallel', 'Insert', 'Retail', 'Refractor', 'Xfractors', 'Mini', 
                        'Press Proof', 'Chrome', 'Holo', 'Fire Burst', 'Rookie', 'Camo', 'Lazer', 'Velocity', 'Reactive', 'Die Cut', 
                        'Pulsar', 'Disco', 'Sticker', 'Shock'];

        // Fetch all cards excluding specific CardSport values
        const cards = await db.query("SELECT CardID, CardSet FROM Card WHERE Sport NOT IN ('Pokemon (English)', 'Pokemon (Japan)')");

        // Iterate through each card and update the variant if it matches
        for (const card of cards) {
            if (card.CardSet && variants.some(variant => card.CardSet.toLowerCase().includes(variant.toLowerCase()))) {
                // If CardSet is not null and includes any variant
                for (const variant of variants) {
                    if (card.CardSet.toLowerCase().includes(variant.toLowerCase())) {
                        await db.query('UPDATE Card SET CardVariant = ? WHERE CardID = ?', [variant, card.CardID]);
                        break; // Break out of the variant loop once a match is found
                    }
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

