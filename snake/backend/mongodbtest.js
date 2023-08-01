const mongoose = require('mongoose');

const url = 'mongodb://127.0.0.1:27017';
const dbName = 'llm';

mongoose.connect(`${url}/${dbName}`, {
   useNewUrlParser: true,
  useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to the database');
    // Perform database operations
  })
  .catch((err) => {
    console.error('Failed to connect to the database:', err);
  });
