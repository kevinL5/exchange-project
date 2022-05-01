const express = require("express");
const app = express();
const cors = require("cors");

const secp = require("@noble/secp256k1");
const sha256 = require("crypto-js/sha256");

const port = 3042;

// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());

const DEFAULT_ETH_AMOUNT = 100;
const balances = {};

function generateBalances() {
  const publicKeys = [];
  const privateKeys = [];

  // generate 3 accounts with DEFAULT_ETH_AMOUNT
  for (let i = 0; i < 3; i++) {
    const privateKey = secp.utils.bytesToHex(secp.utils.randomPrivateKey());
    const publicKey = secp.utils.bytesToHex(secp.getPublicKey(privateKey));

    publicKeys.push(publicKey);
    privateKeys.push(privateKey);

    balances[publicKey] = DEFAULT_ETH_AMOUNT;
  }

  // print accounts details
  console.log("Available Accounts");
  console.log("==================");
  publicKeys.map((publicKey, index) =>
    console.log(`(${index}) ${publicKey} (${DEFAULT_ETH_AMOUNT}ETH)`)
  );
  console.log("");
  console.log("Private Keys");
  console.log("==================");
  privateKeys.map((privateKey, index) =>
    console.log(`(${index}) ${privateKey}`)
  );
}

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;

  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { amount, recipient, signature, recovery } = req.body;

  const messageHash = sha256(JSON.stringify({ amount, recipient })).toString();

  const sender = secp.utils.bytesToHex(
    secp.recoverPublicKey(messageHash, signature, recovery)
  );

  const isValid = secp.verify(signature, messageHash, sender);

  if (!isValid) {
    return res.status(400).send({ balance: balances[sender] });
  }

  balances[sender] -= amount;
  balances[recipient] = (balances[recipient] || 0) + +amount;
  res.send({ balance: balances[sender] });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
  generateBalances();
});
