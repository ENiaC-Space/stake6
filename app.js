console.log("APP LOADED");

let web3;
let account;

const CHAIN_ID = "0x38";
const MASTERCHEF = "0x564DF71B75855d63c86a267206Cd0c9e35c92789";

/* ABI RÚT GỌN – CHẮC CHẮN CHẠY */
const MASTER_ABI = [
  {"inputs":[{"name":"_pid","type":"uint256"}],"name":"poolInfo","outputs":[{"name":"lpToken","type":"address"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"name":"_pid","type":"uint256"},{"name":"_amount","type":"uint256"}],"name":"deposit","stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"name":"_pid","type":"uint256"},{"name":"_amount","type":"uint256"}],"name":"withdraw","stateMutability":"nonpayable","type":"function"},
  {"inputs":[],"name":"poolLength","outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"}
];

const ERC20_ABI = [
  {"constant":true,"inputs":[],"name":"decimals","outputs":[{"type":"uint8"}],"type":"function"},
  {"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"amount","type":"uint256"}],"name":"approve","outputs":[{"type":"bool"}],"type":"function"}
];

document.getElementById("connectBtn").onclick = connectWallet;

function master() {
  return new web3.eth.Contract(MASTER_ABI, MASTERCHEF);
}

async function connectWallet() {
  if (!window.ethereum) return alert("Cài MetaMask");

  if (ethereum.chainId !== CHAIN_ID) {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAIN_ID }]
    });
  }

  web3 = new Web3(window.ethereum);
  const accs = await ethereum.request({ method: "eth_requestAccounts" });
  account = accs[0];

  document.getElementById("wallet").innerText = account;
  loadPools();
}

async function loadPools() {
  const farms = document.getElementById("farms");
  farms.innerHTML = "Loading pools...";

  const len = await master().methods.poolLength().call();
  farms.innerHTML = "";

  for (let pid = 0; pid < len; pid++) {
    farms.innerHTML += `
      <div class="farm">
        Pool ${pid}<br>
        <input id="amt${pid}" placeholder="Amount">
        <button onclick="approve(${pid})">Approve</button>
        <button onclick="stake(${pid})">Stake</button>
      </div>
    `;
  }
}

async function approve(pid) {
  const pool = await master().methods.poolInfo(pid).call();
  const token = new web3.eth.Contract(ERC20_ABI, pool.lpToken);
  const decimals = await token.methods.decimals().call();
  const max = BigInt(10) ** BigInt(decimals) * BigInt(1_000_000);

  await token.methods.approve(MASTERCHEF, max.toString())
    .send({ from: account });
}

async function stake(pid) {
  const val = document.getElementById("amt" + pid).value;
  if (!val) return alert("Nhập amount");

  const pool = await master().methods.poolInfo(pid).call();
  const token = new web3.eth.Contract(ERC20_ABI, pool.lpToken);
  const decimals = await token.methods.decimals().call();
  const amount = BigInt(val) * (BigInt(10) ** BigInt(decimals));

  await master().methods.deposit(pid, amount.toString())
    .send({ from: account });
}
