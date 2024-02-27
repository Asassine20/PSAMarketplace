const axios = require('axios');
const cheerio = require('cheerio');
const { query } = require('../db'); // Adjust the path as needed

const baseUrl = 'http://www.sportscarddatabase.com';

const fetchPage = async (url) => {
    try {
        const response = await axios.get(url);
        return cheerio.load(response.data);
    } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        return null;
    }
};

const insertIntoProductsCopy = async (link) => {
    const $ = await fetchPage(link);
    if (!$) return;

    const setElements = $("a[href*='/CardItem.aspx?id=']");
    
    for (let i = 0; i < setElements.length; i++) {
        const dataPoint = $(setElements[i]).text().trim();
        // Assuming the dataPoint is correctly parsed to extract these variables
        const [yearAndSet, numberAndName] = dataPoint.split("#");
        const yearSetParts = yearAndSet.split(" ");
        const numberNameParts = numberAndName.split(" ");

        const season = yearSetParts[0]; // The year
        const setName = yearSetParts.slice(1).join(" "); // The set name
        const cardNumber = numberNameParts[0]; // The card number
        const cardName = numberNameParts.slice(1).join(" "); // The player's name

        // Ensure variables are defined within the scope they're used
        const values = [season, setName, cardNumber, cardName, 'Hockey'];

        try {
            const sql = "INSERT INTO NewCard (CardYear, CardSet, CardNumber, CardName, Sport) VALUES (?, ?, ?, ?, ?)";
            await query(sql, values);
        } catch (error) {
            console.error('Failed to insert card:', error.toString());
        }
    }
};


const startScraping = async () => {
    const url = "http://www.sportscarddatabase.com/CardSetList.aspx?sp=4";
    const $ = await fetchPage(url);
    if (!$) return;

    const elements = $("a[href*='/CardSet.aspx?sid=']");
    for (let i = 0; i < elements.length; i++) {
        const link = baseUrl + $(elements[i]).attr('href');
        await insertIntoProductsCopy(link);
    }
};

startScraping();
