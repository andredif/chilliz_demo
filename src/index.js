const express = require('express');
const lib = require('./lib.js');

const app = express();
const port = 3000;
const interface = '0.0.0.0';

app.use(express.json());

// Endpoint to start indexing from a specific block
app.post('/start_indexing/:blockNumber', async (req, res, next) => {
  var setLatest = await lib.setLatestBlock(req.params.blockNumber);
  if (setLatest === true) {
    res.on('finish', () =>{
      lib.read();
    })
    res.send(`Indexing started from block ${req.params.blockNumber}`);
  } else {
    res.send(`Indexing not started from block ${req.params.blockNumber}`);
  };
  next()

});


//get all CHZ transferred
app.get('/total_value_transferred/', async (req, res) => {
  const totalValue = await lib.getTotalValue();
  res.send(`Total value transferred is: ${totalValue}`);
});


app.get('/check_transaction/:txHash', async (req, res) => {
  var isCHZ = await lib.readTransaction(req.params.txHash);
  if (isCHZ === true) {
    res.send('Transaction interacted with CHZ token');
  } else {
    res.send('Transaction not interacted with CHZ token');
  }
});


app.listen(port, interface, () => {
  console.log(`Server running on http://${interface}:${port}`);
});
