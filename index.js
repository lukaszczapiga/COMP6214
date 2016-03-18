var express = require('express');
var path = require('path');
var app = express();
var data = require('./data.json');

app.set('port', (process.env.PORT || 5000));

//app.use(express.static(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));

//API routes
app.get('/api/data', function(req, res) {
    res.json(data);
});

// frontend routes
// route to handle all angular requests
app.get('/*', function(req, res) {
  res.sendFile('index.html', { root: path.join(__dirname, '/public') });
  //res.sendFile('../app/public/index.html');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


