const db = require('./db'); // Replace './db' with your database connection module path

// Function to capitalize the first letter of each word
function capitalizeFirstLetter(string) {
    if (!string) return string; // Return the original string if it's null or undefined
    return string.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
}

// Function to process a batch of rows
async function processBatch(offset, limit) {
    try {
        const results = await db.query('SELECT CardID, CardVariant FROM Card LIMIT ? OFFSET ?', [limit, offset]);

        for (const row of results) {
            if (row.CardVariant) { // Check if CardVariant is not null
                const updatedVariant = capitalizeFirstLetter(row.CardVariant);

                await db.query('UPDATE Card SET CardVariant = ? WHERE CardID = ?', [updatedVariant, row.CardID]);
                console.log(`Updated CardID ${row.CardID} with Variant ${updatedVariant}`);
            }
        }
    } catch (error) {
        console.error('Error in processBatch:', error);
        throw error; // Rethrow the error to be caught in the main function
    }
}

// Main function to update the card variants
async function updateCardVariants() {
    const batchSize = 1000; // Number of rows to process in each batch
    let offset = 0;

    try {
        const totalCards = await db.query('SELECT COUNT(*) AS count FROM Card');
        const totalCount = totalCards[0].count;

        while (offset < totalCount) {
            await processBatch(offset, batchSize);
            offset += batchSize;
        }

        console.log('Card variants updated successfully.');
    } catch (error) {
        console.error('Error updating card variants:', error);
    }
}

// Run the main function
updateCardVariants();
