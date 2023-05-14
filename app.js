const axios = require('axios');
const fs = require('fs');
const { DateTime } = require('luxon');
const express=require('express')
const app=express()
// API endpoint to get balance for a bitcoin address
const balanceUrl = "https://blockchain.info/balance?active=";

// API endpoint to get current price of BTC/USD
const priceUrl = "https://api.coindesk.com/v1/bpi/currentprice.json";

// Bitcoin addresses
const addresses = [
  "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo",
  "bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97",
  "3JJmF63ifcamPLiAmLgG96RA599yNtY3EQ",
  "3M219KR5vEneNb47ewrPfWyb5jQ2DjxRP6",
  "1LQoWist8KkaUXSPKZHNvEyfrEkPHzSsCd"
];

// Fetch balance for each address
const balances = [];
const fetchBalances = async () => {
  for (const address of addresses) {
    try {
      const response = await axios.get(balanceUrl + address);
      const data = response.data;
      const balance = data[address].final_balance / 100000000;
      balances.push(balance);
    } catch (error) {
      return("Error fetching balance for " + address);
    }
  }
};

// Fetch current BTC/USD price
let usdPrice;
const fetchPrice = async () => {
  try {
    const response = await axios.get(priceUrl);
    const data = response.data;
    usdPrice = parseFloat(data.bpi.USD.rate.replace(",", ""));
  } catch (error) {
   return("Error fetching current BTC/USD price");
  }
};

// Print balances and USD values to console
const printBalances = () => {
  console.log("Address, Balance, Value in USD");
  for (let i = 0; i < addresses.length; i++) {
    if (i < balances.length) {
      const usdValue = Math.round(balances[i] * usdPrice * 100) / 100;
      console.log(
        addresses[i] + ", " + balances[i] + ", " + usdValue
      );
    } else {
      console.log(addresses[i] + ", N/A, N/A");
    }
  }
};

// Ethereum addresses and ERC20 token addresses
const ethereumAddresses = ["0xF2e8930f92972E80e03DdCc9D903618f48A60Dc5"];
const tokenAddresses = ["0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84"];

// Fetch balances for Ethereum addresses
const ethereumBalances = [];
const fetchEthereumBalances = async () => {
  for (const address of ethereumAddresses) {
    try {
      const balanceUrl = `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=1AWZQFFHZR8XUCN33TY96MW41J8C2GWRED`;
      const response = await axios.get(balanceUrl);
      const data = response.data;
      const result = data.result;
      const resultf = parseFloat(result);
      ethereumBalances.push(resultf * (1e-18));
    } catch (error) {
      return("Error");
    }
  }
};

// ERC20 token contracts
const erc20Contracts = [
  ["stETH", "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84", -18],
  ["USDC", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", -6]
];

// Fetch ERC20 token balances
const erc20Balances = [];
const fetchErc20Balances = async () => {
  for (const erc20Address of ethereumAddresses) {
    for (const contract of erc20Contracts) {
      try {
        const contractAddress = contract[1];
        const erc20Url = `https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=${contractAddress}&address=${erc20Address}&tag=latest&apikey=1AWZQFFHZR8XUCN33TY96MW41J8C2GWRED`;
        const response = await axios.get(erc20Url);
        const data = response.data;
        const result = data.result;
        const resultf = parseFloat(result);
        const precision = contract[2];
        const balance = resultf * Math.pow(10, -precision);
        erc20Balances.push(balance);
      } catch (error) {
        return("Error");
      }
    }
  }
};

// Generate CSV file with balances
const generateCSV = () => {
  const filename = "Final" + DateTime.now().toFormat("yyyy-MM-dd_HH-mm-ss") + ".csv";
  const rows = [];
  rows.push(["Address", "Balance", "Currency"]);

  for (let i = 0; i < addresses.length; i++) {
    if (i < balances.length) {
      rows.push([addresses[i], balances[i], "BTC"]);
    } else {
      rows.push([addresses[i], "N/A", "BTC"]);
    }
  }

  for (let i = 0; i < ethereumAddresses.length; i++) {
    if (i < ethereumBalances.length) {
      rows.push([ethereumAddresses[i], ethereumBalances[i], "ETH"]);
    } else {
      rows.push([ethereumAddresses[i], "N/A", "ETH"]);
    }
  }
  for (let i = 0; i < erc20Contracts.length; i++) {
    if (i < erc20Balances.length) {
      rows.push([erc20Contracts[i][1], erc20Balances[i], erc20Contracts[i][0]]);
    } else {
      rows.push([erc20Contracts[i][1], "N/A", erc20Contracts[i][0]]);
    }
  }

  let csvContent = rows.map(row => row.join(",")).join("\n");

  fs.writeFile(filename, csvContent, 'utf8', (error) => {
    if (error) {
      return("Error writing to CSV file");
    } else {
      return(`CSV file "${filename}" generated successfully.`);
    }
  });
};

// Main function to fetch data and generate CSV
const fetchDataAndGenerateCSV = async () => {
  await fetchBalances();
  await fetchPrice();
  printBalances();
  await fetchEthereumBalances();
  await fetchErc20Balances();
  generateCSV();
};
app.get('/createcsv',async(req, res) => {
  try {
    const response=await fetchDataAndGenerateCSV(); // Invoke the function to generate CSV

    // Send a response to the client
    return res.status(200).send(response||'CSV file generation completed.');
  } catch (error) {
    console.error('Error generating CSV:', error);
    return res.status(500).send('Error generating CSV.');
  }
  res.send('CSV file created successfully!');
})
// fetchDataAndGenerateCSV();



app.listen(3000, () => {
  console.log('App listening on port 3000!');
});