var express = require('express');
var router = express.Router();

const ERC20 = require('../contracts/ERC20.json');
const Farm = require('../contracts/farm/Farm.json');
const MomaFarm = require('../contracts/farm/MomaFarm.json');
const Vesting = require('../contracts/farm/Vesting.json');
const Pair = require('../contracts/UniswapV2Pair.json');
const PadStaking = require('../contracts/farm/PadStaking.json');

const Web3 = require('web3');
const { ethers } = require('ethers');

const web3 = new Web3(new Web3.providers.HttpProvider('https://bsc-dataseed.binance.org/'));

const momaAddress = '0xB72842D6F5feDf91D22d56202802Bb9A79C6322E';
const bnbAddress = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
const lpAddress = '0x94e47b2c97781d506E00775787c815481A307F21';
const lpFarm6Address = '0x01A2cE7925dc8E07F23a3Fd5677040811809066b';
const vesting6Address = '0xC4a3829ECDbE8EEc07052D9631a6B52ea5deA60E';
const lpFarm3Address = '0x939351f1274F3b6af210fbbbc839e45D274A0B8C';
const vesting3Address = '0x4Bd704172f500e96d15b4f388113529dEE81049c';
const lpFarm0Address = '0x4eaDA50Ce6f570393967314d8550a0Ec5BC54c80';
const singleFarmAddress = '0xf84718a7B515124009A5B53F0e8c763935FeEb82';
const padStakingAddress = '0x740819bE4a397Ddb9fE45Ea5637AA467DbAC7fAc';

router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

router.get('/share/momasingle/:amount', async (req, res, next) => {
  try {
    const amount = req.params.amount * 1e18;
    const moma = new web3.eth.Contract(ERC20.abi, momaAddress);
    const totalMomaInPool = parseInt(await moma.methods.balanceOf(singleFarmAddress).call());
    const percentInPool = ((amount / (totalMomaInPool + amount)) * 100).toFixed(5);
    return res.send(percentInPool);
  } catch (error) {
    return res.status(404).send('Not Found');
  }
});

router.get('/share/pad/:amount', async (req, res, next) => {
  try {
    const amount = req.params.amount * 1e18;
    const moma = new web3.eth.Contract(ERC20.abi, momaAddress);
    const totalMomaInPool = parseInt(await moma.methods.balanceOf(padStakingAddress).call());
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
    const momaFarming6 = await percentInLPFarm(lpFarm6Address, amount);
    const momaFarming3 = await percentInLPFarm(lpFarm3Address, amount);
    const momaFarming0 = await percentInLPFarm(lpFarm0Address, amount);

    return res.send({ momaFarming6, momaFarming3, momaFarming0 });
  } catch (error) {
    return res.status(404).send('Not Found');
  }
});

const momaToLP = async (amount) => {
  const pair = new web3.eth.Contract(Pair.abi, lpAddress);
  const totalLPSupply = await pair.methods.totalSupply().call();
  const reserves = await pair.methods.getReserves().call();
  const token0 = await pair.methods.token0().call();
  let momaAmount = amount / 2;
  let lpAmount, bnbAmount;

  if (token0.toLowerCase() !== momaAddress.toLowerCase()) {
    const momaInPool = parseInt(reserves[1]);
    const bnbInPool = parseInt(reserves[0]);
    bnbAmount = (momaAmount * bnbInPool) / momaInPool;
    lpAmount = (momaAmount * totalLPSupply) / momaInPool;
  } else {
    const momaInPool = parseInt(reserves[0]);
    const bnbInPool = parseInt(reserves[1]);
    bnbAmount = (momaAmount * bnbInPool) / momaInPool;
    lpAmount = (momaAmount * totalLPSupply) / momaInPool;
  }

  lpAmount = (lpAmount / 1e18).toFixed(5);
  momaAmount = (momaAmount / 1e18).toFixed(5);
  bnbAmount = (bnbAmount / 1e18).toFixed(5);

  return { lpAmount, momaAmount, bnbAmount };
};

const lpToMoma = async (lpAmount) => {
  const pair = new web3.eth.Contract(Pair.abi, lpAddress);
  const totalLPSupply = await pair.methods.totalSupply().call();
  const reserves = await pair.methods.getReserves().call();
  const token0 = await pair.methods.token0().call();
  let momaInPool, bnbInPool;

  if (token0.toLowerCase() !== momaAddress.toLowerCase()) {
    momaInPool = parseInt(reserves[1]);
    bnbInPool = parseInt(reserves[0]);
  } else {
    momaInPool = parseInt(reserves[0]);
    bnbInPool = parseInt(reserves[1]);
  }

  const momaAmount = ((lpAmount * 1e18 * momaInPool) / totalLPSupply / 1e18).toFixed(5);
  const bnbAmount = ((lpAmount * 1e18 * bnbInPool) / totalLPSupply / 1e18).toFixed(5);

  return { momaAmount, bnbAmount };
};

router.get('/share/momafarming/moma/:amount', async (req, res, next) => {
  try {
    const amount = req.params.amount * 1e18;
    const { lpAmount, momaAmount, bnbAmount } = await momaToLP(amount);
    const momaFarming6Share = await percentInLPFarm(lpFarm6Address, lpAmount * 1e18);
    const momaFarming3Share = await percentInLPFarm(lpFarm3Address, lpAmount * 1e18);
    const momaFarming0Share = await percentInLPFarm(lpFarm0Address, lpAmount * 1e18);
    return res.send({ lpAmount, momaAmount, bnbAmount, momaFarming6Share, momaFarming3Share, momaFarming0Share });
  } catch (error) {
    return res.status(404).send('Not Found');
  }
});

const rewardPerBlockSingle = async () => {
  const currentBlock = await web3.eth.getBlockNumber();
  const farm = new web3.eth.Contract(MomaFarm.abi, singleFarmAddress);
  const multiplier = await farm.methods.getMultiplier(currentBlock, currentBlock + 1).call();
  const rewardPerBlock = await farm.methods.momaPerBlock().call();
  return (rewardPerBlock * multiplier) / 1e30;
};

const rewardPerBlockPad = async () => {
  const currentBlock = await web3.eth.getBlockNumber();
  const farm = new web3.eth.Contract(PadStaking.abi, singleFarmAddress);
  const multiplier = await farm.methods.getMultiplier(currentBlock, currentBlock + 1).call();
  const rewardPerBlock = await farm.methods.momaPerBlock().call();
  return (rewardPerBlock * multiplier) / 1e30;
};

const rewardPerBlockLP = async (farmingAddress) => {
  const currentBlock = await web3.eth.getBlockNumber();
  const farm = new web3.eth.Contract(Farm.abi, farmingAddress);
  const multiplier = await farm.methods.getMultiplier(currentBlock, currentBlock + 1).call();
  const rewardPerBlock = await farm.methods.rewardPerBlock().call();
  return (rewardPerBlock * multiplier) / 1e30;
};

router.get('/rewardperblock', async (req, res, next) => {
  try {
    const moma_single = await rewardPerBlockSingle();
    const pad_staking = await rewardPerBlockPad();
    const moma_farming6 = await rewardPerBlockLP(lpFarm6Address);
    const moma_farming3 = await rewardPerBlockLP(lpFarm3Address);
    const moma_farming0 = await rewardPerBlockLP(lpFarm0Address);
    return res.send({ moma_single, pad_staking, moma_farming6, moma_farming3, moma_farming0 });
  } catch (error) {
    return res.status(404).send('Not Found');
  }
});

const getSingleFarmInfo = async (user) => {
  const farm = new web3.eth.Contract(MomaFarm.abi, singleFarmAddress);
  const userInfo = await farm.methods.userInfo(user).call();
  const moma = new web3.eth.Contract(ERC20.abi, momaAddress);
  const totalMomaInPool = parseInt(await moma.methods.balanceOf(singleFarmAddress).call());
  const deposited = (userInfo.amount / 1e18).toFixed(5);
  const share = ((deposited * 1e18 * 100) / totalMomaInPool).toFixed(5);
  const harvestable = (parseInt(await farm.methods.pendingMoma(user).call()) / 1e18).toFixed(5);

  return { share, deposited, harvestable };
};

const getPadStakingInfo = async (user) => {
  const padStaking = new web3.eth.Contract(PadStaking.abi, padStakingAddress);
  const userInfo = await padStaking.methods.userInfo(user).call();
  const moma = new web3.eth.Contract(ERC20.abi, momaAddress);
  const totalMomaInPool = parseInt(await moma.methods.balanceOf(padStakingAddress).call());
  const deposited = (userInfo.amount / 1e18).toFixed(5);
  const share = ((deposited * 1e18 * 100) / totalMomaInPool).toFixed(5);
  console.log('hehe3');

  const harvestable = (parseInt(await padStaking.methods.pendingMoma(user).call()) / 1e18).toFixed(5);
  console.log('hehe4');

  return { share, deposited, harvestable };
};

const getLPFarmInfo = async (farmingAddress, vestingAddress, user, isVesting) => {
  const farm = new web3.eth.Contract(Farm.abi, farmingAddress);

  const userInfo = await farm.methods.userInfo(user).call();
  const deposited = (userInfo.amount / 1e18).toFixed(5);
  const harvestable = (parseInt(await farm.methods.pendingReward(user).call()) / 1e18).toFixed(5);
  let locked = 0;
  let claimable = 0;
  if (isVesting) {
    const vesting = new web3.eth.Contract(Vesting.abi, vestingAddress);
    locked = await vesting.methods.getTotalAmountLockedByUser(user).call();
    claimable = await vesting.methods.getVestingTotalClaimableAmount(user).call();
  }

  locked = (locked / 1e18).toFixed(5);
  claimable = (claimable / 1e18).toFixed(5);

  const { momaAmount, bnbAmount } = await lpToMoma(deposited);
  const lpToken = new web3.eth.Contract(ERC20.abi, lpAddress);
  const totalLPInPool = parseInt(await lpToken.methods.balanceOf(farmingAddress).call());
  const share = ((parseInt(userInfo.amount) / totalLPInPool) * 100).toFixed(5);
  const lp = {
    share,
    deposited,
    moma: momaAmount,
    bnb: bnbAmount,
  };
  return { lp, harvestable, locked, claimable };
};

router.get('/wallet/:address', async (req, res, next) => {
  try {
    const address = req.params.address.toLowerCase();
    if (!web3.utils.isAddress(address)) return res.send('Invalid Address');
    const moma = new web3.eth.Contract(ERC20.abi, momaAddress);
    const momaInWallet = (parseInt(await moma.methods.balanceOf(address).call()) / 1e18).toFixed(5);
    console.log('hehe');
    const singleFarm = await getSingleFarmInfo(address);
    console.log('hehe2');
    const padStaking = await getPadStakingInfo(address);
    console.log('hehe3');

    const lpFarm6 = await getLPFarmInfo(lpFarm6Address, vesting6Address, address, true);
    const lpFarm3 = await getLPFarmInfo(lpFarm3Address, vesting3Address, address, true);
    const lpFarm0 = await getLPFarmInfo(lpFarm0Address, '', address, false);

    return res.send({ momaInWallet, singleFarm, padStaking, lpFarm6, lpFarm3, lpFarm0 });
  } catch (error) {
    return res.status(404).send('Not Found');
  }
});

module.exports = router;
