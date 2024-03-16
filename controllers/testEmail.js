const { sendConfirmationEmail } = require('./email'); // Adjust the path as necessary

// Define test user data
const testUser = {
    id: '85', // Provide a test user ID
    email: 'kickznkardz@gmail.com' // Replace with your test email address
};

// Call the sendConfirmationEmail function with the test user
sendConfirmationEmail(testUser)
    .then(() => console.log('Test email sent successfully'))
    .catch(error => console.error('Error sending test email:', error));
