const axios = require('axios');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');
require('dotenv').config(); // Ensure you have dotenv to load .env variables
const db = require('../db'); // Ensure this is your promise-based connection module

const baseUrl = 'https://www.cardboardconnection.com/sports-cards-sets/page/';
const validSports = ['Baseball', 'Basketball', 'Football', 'Hockey', 'Soccer', 'UFC', 'Golf'];

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

function parseTitle(title) {
  const parts = title.split(' ');
  const year = parts.shift();
  let sport = validSports.find(sport => title.toLowerCase().includes(sport.toLowerCase())) || '';
  if (sport) {
    sport = capitalizeFirstLetter(sport);
  }
  const sportIndex = parts.findIndex(part => validSports.includes(capitalizeFirstLetter(part)));
  if (sportIndex !== -1) {
    parts.splice(sportIndex, 1);
  }
  const cardSet = parts.join(' ').replace(/Cards|Checklist/gi, '').trim();
  return { year, sport, cardSet };
}

async function checkIfSetExists(cardSet, year, sport) {
  const query = 'SELECT COUNT(*) as count FROM Card1 WHERE CardSet = ? AND CardYear = ? AND Sport = ?';
  const [rows] = await db.query(query, [cardSet, year, sport]);
  return rows[0].count > 0;
}

async function scrapePage(pageNumber, newSets) {
  const url = `${baseUrl}${pageNumber}`;
  const $ = await fetchHTML(url);
  if (!$) return;

  let cards = [];

  $('.archive-post-left .entry').each((i, el) => {
    const title = $(el).find('.post-title a').attr('title') || null;
    const link = $(el).find('.post-title a').attr('href') || null;

    if (
      title &&
      link &&
      (validSports.some(sport => title.toLowerCase().includes(sport.toLowerCase())) ||
        title.toLowerCase().endswith('cards') ||
        title.toLowerCase().endswith('checklist'))
    ) {
      const { year, sport, cardSet } = parseTitle(title);
      cards.push({ year, sport, cardSet, title, link });
    }
  });

  for (const card of cards) {
    const exists = await checkIfSetExists(card.cardSet, card.year, card.sport);
    if (exists) {
      console.log(`Set ${card.cardSet} (${card.year} - ${card.sport}) already exists. Skipping...`);
      continue;
    }

    const $$ = await fetchHTML(card.link);
    if (!$$) continue;

    const players = new Set();
    let currentVariant = null;

    $$('h3.hot-title, .tablechecklist').each((i, el) => {
      if ($$(el).is('h3.hot-title')) {
        currentVariant = $$(el).text().replace(/Set Checklist/i, '').replace(/Checklist/i, '').trim();
      } else if ($$(el).is('.tablechecklist')) {
        const playerTexts = $$(el).html().split('<br>');
        playerTexts.forEach(playerText => {
          const { cardNumber, cardName, team } = parsePlayerText(playerText);
          if (cardName && !/^\d+$/.test(cardName)) {
            players.add(JSON.stringify({ cardName, cardNumber, cardColor: null, cardVariant: currentVariant, sport: card.sport, year: card.year, cardSet: card.cardSet, team }));
          }
        });
      }
    });

    const playersArray = Array.from(players).map(playerText => {
      const { cardName, cardNumber, cardColor, cardVariant, sport, year, cardSet, team } = JSON.parse(playerText);
      return [cardName, cardNumber, cardColor, cardVariant, sport, year, cardSet, team];
    });

    if (playersArray.length > 0) {
      const query = 'INSERT INTO Card1 (CardName, CardNumber, CardColor, CardVariant, Sport, CardYear, CardSet, Team) VALUES ?';
      await db.query(query, [playersArray]).then(() => {
        console.log(`Inserted ${playersArray.length} cards from set ${card.title} into the Card1 table`);
        newSets.push(card.title);
      }).catch(error => {
        console.error(`Error inserting data into the Card1 table for set ${card.title}:`, error);
      });
    }
  }
}

async function scrapeAllPages() {
  let currentPage = 1;
  let hasMorePages = true;
  let newSets = [];

  while (hasMorePages) {
    console.log(`Scraping page ${currentPage}...`);
    const url = `${baseUrl}${currentPage}`;
    const $ = await fetchHTML(url);

    if (!$) {
      hasMorePages = false;
    } else {
      const isEmptyPage = $('.archive-post-left .entry').length === 0;
      if (isEmptyPage) {
        hasMorePages = false;
      } else {
        await scrapePage(currentPage, newSets);
        currentPage++;
      }
    }
  }

  if (newSets.length > 0) {
    sendEmailNotification(newSets);
  }

  console.log("Completed scraping all pages.");
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

scrapeAllPages().catch(console.error);
