const contractAddress = process.env.CONTRACT_ADDRESS;
const web3Provider = process.env.WEB3_PROVIDER;
const wss3Provider = process.env.WSS3_PROVIDER;
const mongoUrl = process.env.MONGO_URL;
const Web3 = require('web3');
const mongoose = require('mongoose');
const web3 = new Web3(web3Provider);
const ws3 = new Web3(wss3Provider);


mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));

const chzTransactionSchema = new mongoose.Schema({
  blockNumber: Number,
  hash: String,
  from: String,
  to: String,
  value: Number,
});

const blockSchema = new mongoose.Schema({
  blockNumber: Number,
  position: String,
});

const Transaction = mongoose.model("Transaction", chzTransactionSchema);
const Block = mongoose.model("Block", blockSchema);

module.exports = {


getTotalValue: async function getAllValueTransactedDB() {
  var transactions = await Transaction.find();
  var total = 0;
  transactions.forEach(element => {
    total += parseInt(element.value);
  });
  return total;
},

setLatestBlock: async function setLatestBlockDB(blockNum) {
  var latest = await Block.findOne({position : "latest"});
  if (latest == undefined){
    var newBlock = await Block.create({
      blockNumber: blockNum,
      position : "latest",
    });
    return true;
  } else {
    if (latest.blockNumber > blockNum) {
      await Block.updateOne({position : "latest", blockNumber: blockNum});
      return true;
    };
    return false;
  }
},

read: async function readTransactions() {
    var latestBlockData = await Block.findOne({position : "latest"});
    var latestBlock = latestBlockData.blockNumber;

    while (true) {
      var currentBlock = await web3.eth.getBlockNumber();
      if (latestBlock != currentBlock) {
        var oldestBlock = Math.min(latestBlock, currentBlock);
        blockData = await web3.eth.getBlock(oldestBlock, true);
        if (blockData && blockData.transactions.length > 0) {
          for (var tx of blockData.transactions) {

            var toAddress = tx.to ? Web3.utils.toChecksumAddress(tx.to) : null;
            var contractChecksum = Web3.utils.toChecksumAddress(contractAddress);
            if (toAddress === contractChecksum || tx.input.includes(contractChecksum.replace('0x', ''))) {

              var transaction = new Transaction(
                {
                  blockNumber: tx.blockNumber,
                  hash: tx.hash,
                  from: tx.from,
                  to: tx.to,
                  value: tx.value,

                }
              );
              await transaction.save();
            }
          };
        }
      } else {
        await new Promise(r => setTimeout(r, 2000));
      }
      latestBlock ++;
    }

  },


readTransaction: async function readTransactionData(txHash) {
  console.log(txHash);
  var transactionData = await web3.eth.getTransaction(txHash);
  if (transactionData != null) {
    var toAddress = Web3.utils.toChecksumAddress(transactionData.to);
    var contractChecksum = Web3.utils.toChecksumAddress(contractAddress);

    if (toAddress == contractChecksum) {
      return true;
    };
  }
  return false;
},

}

