const axios = require('axios');
const cheerio = require('cheerio');
const db = require('./db'); // Ensure this is your promise-based connection module

async function scrapeCardDataFromLink(link) {
    try {
        const { data } = await axios.get(link);
        const $ = cheerio.load(data);
        const cards = [];

        $('tr').each((i, element) => {
            const cardNumber = $(element).find('td:nth-child(1)').text().trim() || null;
            const cardName = $(element).find('td:nth-child(3) a').attr('title') || null;
            const cardType = $(element).find('th a').attr('title') || null;
            const cardRarity = $(element).find('td:nth-child(5) a').attr('title') || null;
            const cardVariant = $(element).find('td[style="display:none; background:#FFFFFF"]').text().trim() || 'Regular';

            if (cardName) {
                cards.push({
                    CardNumber: cardNumber,
                    CardName: cardName,
                    CardType: cardType,
                    CardRarity: cardRarity.charAt(0), // Assuming the rarity is indicated by a single letter (e.g., 'C' for Common)
                    CardVariant: cardVariant,
                });
            }
        });

        // Here you would insert the `cards` array data into your database
        console.log(cards);

        // Insert data into the database
        const query = 'INSERT INTO PokemonCard (CardName, CardNumber, CardColor, CardVariant, Sport, CardYear, CardImage, CardSet) VALUES ?';
        const values = cards.map(card => [card.CardName, card.CardNumber, card.CardType, card.CardVariant, 'Pokemon', null, null, 'Derived or Default Card Set']);
        
        await db.query(query, [values]);
        console.log(`Page scraped and data inserted successfully from ${link}`);
        } catch (error) {
            console.error(`Error inserting data into database from ${link}:`, error);
        }
    }

async function scrapeAllLinks() {
    // Assume you have a function to load links from links.txt
    const links = await loadLinksFromFile();

    for (const link of links) {
        console.log(`Scraping: ${link}`);
        await scrapeCardDataFromLink(link);
        // Add a slight delay to prevent hitting the server too rapidly
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second delay
    }
}

scrapeAllLinks();

async function loadLinksFromFile() {
    const filePath = path.join(__dirname, 'links.txt'); // Ensure path is correct
    try {
        const data = await fs.readFile(filePath, { encoding: 'utf8' });
        return data.split('\n').filter(link => link.trim() !== ''); // Filter out empty lines
    } catch (error) {
        console.error('Error reading links file:', error);
        return [];
    }
}