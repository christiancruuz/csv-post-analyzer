const http = require('http');
const postsAnalyzer = require('./posts_analyzer')

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello, Cafe Media! Thanks for the opportunity!\n');
});

server.listen(port, hostname, () => {
    postsAnalyzer('posts.csv', true, true)
    postsAnalyzer('posts.csv', false, true)
  console.log(`Server running at http://${hostname}:${port}/`);
});