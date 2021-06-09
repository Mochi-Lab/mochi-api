var express = require('express');
var router = express.Router();

const Moma = require('../contracts/Moma.json');
const Farm = require('../contracts/farm/Farm.json');
const MomaFarm = require('../contracts/farm/MomaFarm.json');
const Vesting = require('../contracts/farm/Vesting.json');
const Pair = require('../contracts/UniswapV2Pair.json');

const Web3 = require('web3');
const { ethers } = require('ethers');

const web3 = new Web3(new Web3.providers.HttpProvider('https://bsc-dataseed.binance.org/'));

const momaAddress = '0xB72842D6F5feDf91D22d56202802Bb9A79C6322E';
const lpAddress = '0x94e47b2c97781d506E00775787c815481A307F21';
const singleMomaFarmAddress = '0xf84718a7B515124009A5B53F0e8c763935FeEb82';

router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

router.get('/share/momasingle/:amount', async (req, res, next) => {
  try {
    const amount = req.params.amount * 1e18;
    const moma = new web3.eth.Contract(Moma.abi, momaAddress);
    const totalMomaInPool = parseInt(await moma.methods.balanceOf(singleMomaFarmAddress).call());
    const percentInPool = ((amount / (totalMomaInPool + amount)) * 100).toFixed(5);
    return res.send(percentInPool);
  } catch (error) {
    console.log(error);
    return res.status(404).send('Not Found');
  }
});

module.exports = router;
