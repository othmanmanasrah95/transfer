// Importing the http module
const http = require('http');

// Importing the app module
const app = require('./app');

// Setting up the port to be either the value of the process.env.PORT environment variable or 3000 if it is not defined
const port = process.env.PORT || 3000;

// Creating a server using the http module and passing in the app module as the request listener callback
const server = http.createServer(app);

// Start the server and listen on the specified port
server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});