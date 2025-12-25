/****************************************************
 * ENiaC Stake DApp – FINAL FIX (BSC MAINNET)
 * Author: ChatGPT – Production Safe
 ****************************************************/

let web3;
let account;

/* ========= CONFIG ========= */
const CHAIN_ID = "0x38"; // BSC Mainnet
const BSC_RPC = "https://bsc-dataseed.binance.org/";
const MASTERCHEF = "0x564DF71B75855d63c86a267206Cd0c9e35c92789";

/* ========= ABI ========= */
const MASTER_ABI = [
  {
    "inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"}],
    "name":"poolInfo",
    "outputs":[
      {"internalType":"contract IERC20","name":"lpToken","type":"address"},
      {"internalType":"uint256","name":"allocPoint","type":"uint256"},
      {"internalType":"uint256","name":"lastRewardBlock","type":"uint256"},
      {"internalType":"uint256","name":"accANTPerShare","type":"uint256"}
    ],
    "stateMutability":"view","type":"function"
  },
  {
    "inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"},{"internalType":"address","name":"_user","type":"address"}],
    "name":"userInfo",
    "outputs":[
      {"internalType":"uint256","name":"amount","type":"uint256"},
      {"internalType":"uint256","name":"rewardDebt","type":"uint256"}
    ],
    "stateMutability":"view","type":"function"
  },
  {
    "inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"},{"internalType":"uint256","name":"_amount","type":"uint256"}],
    "name":"deposit","stateMutability":"nonpayable","type":"function"
  },
  {
    "inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"},{"internalType":"uint256","name":"_amount","type":"uint256"}],
    "name":"withdraw","stateMutability":"nonpayable","type":"function"
  },
  {
    "inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"},{"internalType":"address","name":"_user","type":"address"}],
    "name":"pendingANT",
    "outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
    "stateMutability":"view","type":"function"
  },
  {
    "inputs":[],
    "name":"poolLength",
    "outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
    "stateMutability":"view","type":"function"
  }
];

const ERC20_ABI = [
  { "constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"type":"function" },
  { "constant":true,"inputs":[{"name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"type":"function" },
  { "constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"type":"function" },
  { "constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"amount","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"type":"function" }
];

/* ========= INIT ========= */
window.addEventListener("load", () => {
  document.getElementById("connectBtn").onclick = connectWallet;
});

function master() {
  return new web3.eth.Contract(MASTER_ABI, MASTERCHEF);
}

/* ========= CONNECT WALLET ========= */
async function connectWallet() {
  if (!window.ethereum) {
    alert("Vui lòng cài MetaMask");
    return;
  }

  if (ethereum.chainId !== CHAIN_ID) {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAIN_ID }]
    });
  }

  web3 = new Web3(window.ethereum);
  const accs = await ethereum.request({ method: "eth_requestAccounts" });
  account = accs[0];

  document.getElementById("wallet").innerText =
    account.slice(0, 6) + "..." + account.slice(-4);

  loadPools();
}

/* ========= CORE ========= */
async function getPoolToken(pid) {
  const pool = await master().methods.poolInfo(pid).call();
  const token = new web3.eth.Contract(ERC20_ABI, pool.lpToken);
  const decimals = await token.methods.decimals().call();
  const balance = await token.methods.balanceOf(account).call();
  return { token, decimals, balance, address: pool.lpToken };
}

/* ========= LOAD POOLS ========= */
async function loadPools() {
  const farms = document.getElementById("farms");
  farms.innerHTML = "";

  const total = await master().methods.poolLength().call();

  for (let pid = 0; pid < total; pid++) {
    const user = await master().methods.userInfo(pid, account).call();
    const pending = await master().methods.pendingANT(pid, account).call();

    farms.innerHTML += `
      <div class="farm">
        <h4>Pool #${pid}</h4>
        <div>Staked: ${format(user.amount)}</div>
        <div>Pending: ${format(pending)}</div>
        <input id="amt${pid}" placeholder="Amount">
        <button onclick="approve(${pid})">Approve</button>
        <button onclick="stake(${pid})">Stake</button>
        <button onclick="withdraw(${pid})">Withdraw</button>
        <button onclick="harvest(${pid})">Harvest</button>
      </div>
    `;
  }
}

/* ========= ACTIONS ========= */
async function approve(pid) {
  const { token, decimals } = await getPoolToken(pid);

  const max = web3.utils.toBN(10)
    .pow(web3.utils.toBN(decimals))
    .mul(web3.utils.toBN("1000000000"));

  await token.methods
    .approve(MASTERCHEF, max.toString())
    .send({ from: account });
}

async function stake(pid) {
  const input = document.getElementById("amt" + pid).value;
  if (!input || Number(input) <= 0) return alert("Amount không hợp lệ");

  const { decimals, balance } = await getPoolToken(pid);
  const amount = web3.utils.toBN(input)
    .mul(web3.utils.toBN(10).pow(web3.utils.toBN(decimals)));

  if (amount.gt(web3.utils.toBN(balance))) {
    alert("Không đủ token để stake");
    return;
  }

  await master().methods
    .deposit(pid, amount.toString())
    .send({ from: account });

  loadPools();
}

async function withdraw(pid) {
  const input = document.getElementById("amt" + pid).value;
  if (!input || Number(input) <= 0) return alert("Amount không hợp lệ");

  const { decimals } = await getPoolToken(pid);
  const amount = web3.utils.toBN(input)
    .mul(web3.utils.toBN(10).pow(web3.utils.toBN(decimals)));

  await master().methods
    .withdraw(pid, amount.toString())
    .send({ from: account });

  loadPools();
}

async function harvest(pid) {
  await master().methods
    .deposit(pid, 0)
    .send({ from: account });

  loadPools();
}

/* ========= UTIL ========= */
function format(val) {
  if (!val) return "0";
  return web3.utils.fromWei(val.toString(), "ether");
}
