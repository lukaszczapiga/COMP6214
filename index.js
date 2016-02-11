var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// frontend routes
// route to handle all angular requests
app.get('/*', function(req, res) {
  res.sendFile('index.html', { root: path.join(__dirname, '../public') });
  //res.sendFile('../app/public/index.html');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


