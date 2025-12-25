let web3, account;

// ===== MAINNET ADDRESS (THEO FILE ABI ANH GỬI) =====
const MASTERCHEF = "0x564DF71B75855d63c86a267206Cd0c9e35c92789";
const CHAIN_ID = "0x38"; // BSC mainnet

// ===== ABI ĐẦY ĐỦ – ĐÚNG FILE ANH GỬI =====
const MASTER_ABI = [
  {
    "inputs":[
      {"internalType":"contract IANT","name":"_ANT","type":"address"},
      {"internalType":"contract IVault","name":"_vault","type":"address"},
      {"internalType":"address","name":"_devaddr","type":"address"},
      {"internalType":"uint256","name":"_ANTPerBlock","type":"uint256"},
      {"internalType":"uint256","name":"_startBlock","type":"uint256"}
    ],
    "type":"constructor"
  },
  {
    "inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"}],
    "name":"updatePool",
    "outputs":[],
    "stateMutability":"nonpayable",
    "type":"function"
  },
  {
    "inputs":[{"internalType":"uint256","name":"_pid","type":"uint256"}],
    "name":"poolInfo",
    "outputs":[
      {"internalType":"contract IERC20","name":"lpToken","type":"address"},
      {"internalType":"uint256","name":"allocPoint","type":"uint256"},
      {"internalType":"uint256","name":"lastRewardBlock","type":"uint256"},
      {"internalType":"uint256","name":"accANTPerShare","type":"uint256"}
    ],
    "stateMutability":"view",
    "type":"function"
  },
  {
    "inputs":[
      {"internalType":"uint256","name":"_pid","type":"uint256"},
      {"internalType":"address","name":"_user","type":"address"}
    ],
    "name":"userInfo",
    "outputs":[
      {"internalType":"uint256","name":"amount","type":"uint256"},
      {"internalType":"uint256","name":"rewardDebt","type":"uint256"}
    ],
    "stateMutability":"view",
    "type":"function"
  },
  {
    "inputs":[
      {"internalType":"uint256","name":"_pid","type":"uint256"},
      {"internalType":"uint256","name":"_amount","type":"uint256"}
    ],
    "name":"deposit",
    "outputs":[],
    "stateMutability":"nonpayable",
    "type":"function"
  },
  {
    "inputs":[
      {"internalType":"uint256","name":"_pid","type":"uint256"},
      {"internalType":"uint256","name":"_amount","type":"uint256"}
    ],
    "name":"withdraw",
    "outputs":[],
    "stateMutability":"nonpayable",
    "type":"function"
  },
  {
    "inputs":[
      {"internalType":"uint256","name":"_pid","type":"uint256"},
      {"internalType":"address","name":"_user","type":"address"}
    ],
    "name":"pendingANT",
    "outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
    "stateMutability":"view",
    "type":"function"
  },
  {
    "inputs":[],
    "name":"poolLength",
    "outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
    "stateMutability":"view",
    "type":"function"
  }
];

// ===== ERC20 ABI ĐẦY ĐỦ =====
const ERC20_ABI = [
  {
    "constant":false,
    "inputs":[
      {"name":"spender","type":"address"},
      {"name":"amount","type":"uint256"}
    ],
    "name":"approve",
    "outputs":[{"name":"","type":"bool"}],
    "type":"function"
  },
  {
    "constant":true,
    "inputs":[{"name":"owner","type":"address"}],
    "name":"balanceOf",
    "outputs":[{"name":"","type":"uint256"}],
    "type":"function"
  },
  {
    "constant":true,
    "inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],
    "name":"allowance",
    "outputs":[{"name":"","type":"uint256"}],
    "type":"function"
  }
];

// ===== INIT =====
document.getElementById("connectBtn").onclick = connect;

function master(){
  return new web3.eth.Contract(MASTER_ABI, MASTERCHEF);
}

// ===== CONNECT WALLET =====
async function connect(){
  if(!window.ethereum){
    alert("Cài MetaMask trước");
    return;
  }

  if (ethereum.chainId !== CHAIN_ID){
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAIN_ID }]
    });
  }

  web3 = new Web3(window.ethereum);
  const accs = await ethereum.request({ method: "eth_requestAccounts" });
  account = accs[0];

  document.getElementById("wallet").innerText =
    account.slice(0,6) + "..." + account.slice(-4);

  loadPools();
}

// ===== LOAD POOLS (QUAN TRỌNG) =====
async function loadPools(){
  const len = await master().methods.poolLength().call();
  const div = document.getElementById("farms");
  div.innerHTML = "";

  for(let pid=0; pid<len; pid++){
    const pool = await master().methods.poolInfo(pid).call();
    div.innerHTML += `
      <div class="farm">
        <b>Pool #${pid}</b><br>
        <small>Stake token: ${pool.lpToken}</small><br>
        <input id="amt${pid}" placeholder="Amount">
        <button onclick="approveToken(${pid})">Approve</button>
        <button onclick="stake(${pid})">Stake</button>
        <button onclick="withdraw(${pid})">Withdraw</button>
      </div>
    `;
  }
}

// ===== APPROVE ĐÚNG TOKEN CỦA POOL =====
async function approveToken(pid){
  const pool = await master().methods.poolInfo(pid).call();
  const token = new web3.eth.Contract(ERC20_ABI, pool.lpToken);

  await token.methods
    .approve(MASTERCHEF, web3.utils.toWei("1000000000"))
    .send({ from: account });
}

// ===== STAKE / WITHDRAW =====
async function stake(pid){
  const val = document.getElementById("amt"+pid).value;
  if(!val || val <= 0) return;

  await master().methods
    .deposit(pid, web3.utils.toWei(val))
    .send({ from: account });
}

async function withdraw(pid){
  const val = document.getElementById("amt"+pid).value;
  await master().methods
    .withdraw(pid, web3.utils.toWei(val))
    .send({ from: account });
}
