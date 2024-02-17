const db = require('./db'); // Replace './db' with your database connection module path

async function updateCardVariants() {
    try {
        // Define the variants to search for
        const variants = ['base', 'patch', 'serial', 'autograph','memorabilia','variation','short print', 'draft picks' , 'parallel', 'insert', 'retail', 'refractor', 'xfractors', 'mini', 
                        'press proof','holo', 'fire burst', 'rookie', 'camo', 'lazer', 'velocity', 'reactive', 'die cut', 
                        'pulsar', 'disco','sticker', 'shock' ];

        // Fetch all cards
        const cards = await db.query("SELECT CardID, CardSet FROM Card WHERE Sport <> 'Pokemon'");

        // Iterate through each card and update the variant if it matches
        for (const card of cards) {
            if (card.CardSet && variants.some(variant => card.CardSet.toLowerCase().includes(variant))) {
                // If CardSet is not null and includes any variant
                for (const variant of variants) {
                    if (card.CardSet.toLowerCase().includes(variant)) {
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
