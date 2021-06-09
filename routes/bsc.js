var express = require('express');
var router = express.Router();

const ERC20 = require('../contracts/ERC20.json');
const Farm = require('../contracts/farm/Farm.json');
const MomaFarm = require('../contracts/farm/MomaFarm.json');
const Vesting = require('../contracts/farm/Vesting.json');
const Pair = require('../contracts/UniswapV2Pair.json');

const Web3 = require('web3');
const { ethers } = require('ethers');

const web3 = new Web3(new Web3.providers.HttpProvider('https://bsc-dataseed.binance.org/'));

const momaAddress = '0xB72842D6F5feDf91D22d56202802Bb9A79C6322E';
const lpAddress = '0x94e47b2c97781d506E00775787c815481A307F21';
const lpFarming6Address = '0x01A2cE7925dc8E07F23a3Fd5677040811809066b';
const lpFarming3Address = '0x939351f1274F3b6af210fbbbc839e45D274A0B8C';
const lpFarming0Address = '0x4eaDA50Ce6f570393967314d8550a0Ec5BC54c80';
const singleMomaFarmAddress = '0xf84718a7B515124009A5B53F0e8c763935FeEb82';

router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

router.get('/share/momasingle/:amount', async (req, res, next) => {
  try {
    const amount = req.params.amount * 1e18;
    const moma = new web3.eth.Contract(ERC20.abi, momaAddress);
    const totalMomaInPool = parseInt(await moma.methods.balanceOf(singleMomaFarmAddress).call());
    const percentInPool = ((amount / (totalMomaInPool + amount)) * 100).toFixed(5);
    return res.send(percentInPool);
  } catch (error) {
    return res.status(404).send('Not Found');
  }
});

const percentInLPFarm = async (farmingAddress, amount) => {
  const lp = new web3.eth.Contract(ERC20.abi, lpAddress);
  const totalLPInPool = parseInt(await lp.methods.balanceOf(farmingAddress).call());
  return ((amount / (totalLPInPool + amount)) * 100).toFixed(5);
};

router.get('/share/momafarming/lp/:amount', async (req, res, next) => {
  try {
    const amount = req.params.amount * 1e18;
    const momaFarming6 = await percentInLPFarm(lpFarming6Address, amount);
    const momaFarming3 = await percentInLPFarm(lpFarming3Address, amount);
    const momaFarming0 = await percentInLPFarm(lpFarming0Address, amount);

    return res.send({ momaFarming6, momaFarming3, momaFarming0 });
  } catch (error) {
    return res.status(404).send('Not Found');
  }
});

module.exports = router;
