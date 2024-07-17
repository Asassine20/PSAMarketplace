const axios = require('axios');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');
require('dotenv').config(); // Ensure you have dotenv to load .env variables
const db = require('../db'); // Ensure this is your promise-based connection module

const specificSetLinks = [
  // Add your specific set links here
  'https://www.cardboardconnection.com/specific-set-link-1',
  'https://www.cardboardconnection.com/specific-set-link-2',
  // Add more links as needed
];

const validSports = ['Baseball', 'Basketball', 'Football', 'Hockey', 'Soccer', 'UFC', 'Golf'];
const MAX_CARD_COLOR_LENGTH = 255; // Adjust according to your database schema
const MAX_CARD_NAME_LENGTH = 255; // Adjust according to your database schema
const MAX_CARD_VARIANT_LENGTH = 255; // Adjust according to your database schema
const MAX_CARD_SET_LENGTH = 255; // Adjust according to your database schema
const MAX_TEAM_LENGTH = 255; // Adjust according to your database schema

const patterns = [
  'Prizm', 'Refractor', 'RayWave', 'Wave', 'Artist Proof', 'Atomic', 'Spectrum',
  'Circles', 'Seismic', 'Squares', 'Starball', 'Checker', 'Ice', 'Icy',
  'Die-Cut', 'Glossy', 'Asia', 'Difractor', 'X-Fractor', 'Disco',
  'Etch', 'Finite', 'Flash', 'FOTL', 'Laser', 'Lava', 'Mojo', 'Mosaic', 'Pulsar',
  'Shimmer', 'Tiger', 'Velocity', 'Cosmic', 'Camo', 'Bubbles', 'Vapor', 'Glow',
  'Press Proof', 'Foil', 'Diffractor', 'Prism', 'Die-Cut', 'Holo', 'Sonic Pulse',
  'Spectra', 'Galactic', 'Golazo', 'Kaboom', 'Laundry Tag', 'Prime', 'Printing Plates',
  'SuperFractor', 'Speckle'
];

// Setup nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

async function fetchHTML(url) {
  try {
    const { data } = await axios.get(url);
    return cheerio.load(data);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error(`Page not found: ${url}`);
    } else {
      console.error(`Error fetching ${url}:`, error.message);
    }
    return null;
  }
}

function parsePlayerText(playerText) {
  const sanitizedPlayerText = playerText.replace(/<.*?>/g, '').trim();
  let cardNumber = null;
  let cardName = null;
  let team = null;

  const parts = sanitizedPlayerText.split(' - ');
  if (parts.length > 1) {
    team = parts.pop().trim();
  }

  const firstPart = parts.join(' - ');
  const firstSpaceIndex = firstPart.indexOf(' ');

  if (firstSpaceIndex !== -1) {
    const potentialCardNumber = firstPart.substring(0, firstSpaceIndex);
    const remainingText = firstPart.substring(firstSpaceIndex + 1).trim();

    if (/^[A-Z0-9-]+$/.test(potentialCardNumber) && remainingText) {
      cardNumber = potentialCardNumber;
      cardName = remainingText;
    } else {
      cardName = firstPart;
    }
  } else {
    cardName = firstPart;
  }

  return { cardNumber, cardName, team };
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

function trimToMaxLength(value, maxLength) {
  if (value == null) return value; // Return null or undefined as is
  return value.length > maxLength ? value.substring(0, maxLength) : value;
}

function containsAutographTerms(text) {
  const terms = ['auto', 'autograph', 'autographs', 'autographed'];
  return terms.some(term => text.toLowerCase().includes(term));
}

function extractColorPattern(text) {
  let colorPattern = '';
  for (const pattern of patterns) {
    if (text.toLowerCase().includes(pattern.toLowerCase())) {
      colorPattern = pattern;
      text = text.replace(new RegExp(pattern, 'gi'), '').trim();
      break;
    }
  }
  return { text, colorPattern };
}

function extractNumberedValue(text) {
  const match = text.match(/#\/\s*\d+/);
  if (match) {
    return { text: text.replace(match[0], '').trim(), numbered: match[0].trim() };
  }
  return { text, numbered: '' };
}

async function scrapeSet(link) {
  const $$ = await fetchHTML(link);
  if (!$$) return;

  const title = $$('.post-title').text().trim();
  const { year, sport, cardSet } = parseTitle(title);

  const players = new Set();
  let currentVariant = null;
  let parallels = [];

  $$('h3.hot-title, .checklistdesc, .tablechecklist').each((i, el) => {
    if ($$(el).is('h3.hot-title')) {
      currentVariant = $$(el).text().replace(/Set Checklist/i, '').replace(/Checklist/i, '').trim();
    } else if ($$(el).is('.checklistdesc') && /Parallel/i.test($$(el).text())) {
      const parallelText = $$(el).text().replace(/PARALLEL CARDS:|SPECTRUM PARALLELS:/g, '').trim();
      parallels = parallelText.split(',').map(parallel => trimToMaxLength(parallel.trim(), MAX_CARD_COLOR_LENGTH));
    } else if ($$(el).is('.tablechecklist')) {
      const playerTexts = $$(el).html().split('<br>');
      playerTexts.forEach(playerText => {
        const { cardNumber, cardName, team } = parsePlayerText(playerText);
        if (cardName && !/^\d+$/.test(cardName)) {
          let auto = 0;
          if (containsAutographTerms(cardName) || containsAutographTerms(currentVariant) || parallels.some(parallel => containsAutographTerms(parallel))) {
            auto = 1;
            currentVariant = containsAutographTerms(currentVariant) ? '' : currentVariant;
            parallels = parallels.map(parallel => containsAutographTerms(parallel) ? '' : parallel);
          }

          let { text: newCardColor, colorPattern } = extractColorPattern('Base');
          let { text: finalCardColor, numbered } = extractNumberedValue(newCardColor);
          players.add(JSON.stringify({
            cardName: trimToMaxLength(cardName, MAX_CARD_NAME_LENGTH),
            cardNumber,
            cardColor: trimToMaxLength(finalCardColor, MAX_CARD_COLOR_LENGTH),
            cardVariant: trimToMaxLength(currentVariant, MAX_CARD_VARIANT_LENGTH),
            sport,
            year,
            cardSet: trimToMaxLength(cardSet, MAX_CARD_SET_LENGTH),
            team: trimToMaxLength(team, MAX_TEAM_LENGTH),
            auto,
            colorPattern: trimToMaxLength(colorPattern, MAX_CARD_COLOR_LENGTH),
            numbered: trimToMaxLength(numbered, MAX_CARD_COLOR_LENGTH)
          }));
          parallels.forEach(parallel => {
            if (parallel) {
              let { text: parallelColor, colorPattern: parallelPattern } = extractColorPattern(parallel);
              let { text: finalParallelColor, numbered: parallelNumbered } = extractNumberedValue(parallelColor);
              players.add(JSON.stringify({
                cardName: trimToMaxLength(cardName, MAX_CARD_NAME_LENGTH),
                cardNumber,
                cardColor: trimToMaxLength(finalParallelColor, MAX_CARD_COLOR_LENGTH),
                cardVariant: trimToMaxLength(currentVariant, MAX_CARD_VARIANT_LENGTH),
                sport,
                year,
                cardSet: trimToMaxLength(cardSet, MAX_CARD_SET_LENGTH),
                team: trimToMaxLength(team, MAX_TEAM_LENGTH),
                auto,
                colorPattern: trimToMaxLength(parallelPattern, MAX_CARD_COLOR_LENGTH),
                numbered: trimToMaxLength(parallelNumbered, MAX_CARD_COLOR_LENGTH)
              }));
            }
          });
        }
      });
    }
  });

  const playersArray = Array.from(players).map(playerText => {
    const { cardName, cardNumber, cardColor, cardVariant, sport, year, cardSet, team, auto, colorPattern, numbered } = JSON.parse(playerText);
    return [cardName, cardNumber, cardColor, cardVariant, sport, year, cardSet, team, auto, colorPattern, numbered];
  });

  if (playersArray.length > 0) {
    const query = 'INSERT INTO Card2 (CardName, CardNumber, CardColor, CardVariant, Sport, CardYear, CardSet, Team, Auto, ColorPattern, Numbered) VALUES ?';
    await db.query(query, [playersArray]).then(() => {
      console.log(`Inserted ${playersArray.length} cards from set ${title} into the Card2 table`);
    }).catch(error => {
      console.error(`Error inserting data into the Card2 table for set ${title}:`, error);
    });
  }
}

async function scrapeSpecificSets() {
  for (const link of specificSetLinks) {
    console.log(`Scraping set: ${link}`);
    await scrapeSet(link);
  }

  console.log("Completed scraping specific sets.");
}

async function cleanUpCardColors() {
  const query = `
    UPDATE Card2
    SET CardColor = NULL
    WHERE CardColor NOT REGEXP 'blue|blank|burgundy|peacock|genesis|fusion|clear|dragon|electric|fire|fuchsia|graphite|gray|grey|jade|inferno|lavender|
    |leather|magenta|marble|nebula|neon|negative|onyx|black|yellow|green|gold|red|white|pink|cream|teal|orange|purple|silver|bronze|copper|
    |papradascha|quartz|ruby|tie-dye|wood|metal|base|brown|diamond|lava|sepia|international|asia|rainbow|emerald|chrome|amethyst|platinum|sapphire|aqua';
  `;

  try {
    const [result] = await db.query(query);
    console.log(`Updated ${result.affectedRows} rows.`);
  } catch (error) {
    console.error('Error executing update query:', error);
  }
}

function sendEmailNotification(newSets) {
  const mailOptions = {
    from: process.env.EMAIL_FROM_ADDRESS,
    to: 'asassine44@gmail.com',
    subject: 'New Card Sets Added',
    text: `The following new card sets have been added:\n\n${newSets.join('\n')}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.error(`Error sending email: ${error}`);
    }
    console.log(`Email sent: ${info.response}`);
  });
}

scrapeSpecificSets()
  .then(cleanUpCardColors)
  .catch(console.error);
