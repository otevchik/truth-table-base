import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.9.1/dist/ethers.min.js";

let provider;
let signer;
let userAddress;
let verified = false; // флаг подтверждения владения

const connectBtn = document.getElementById("connectBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const walletDiv = document.getElementById("wallet");

// --- Подключение MetaMask ---
connectBtn.onclick = async () => {
  if (!window.ethereum) {
    alert("MetaMask не найден!");
    return;
  }

  provider = new ethers.BrowserProvider(window.ethereum);

  try {
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    userAddress = await signer.getAddress();

    walletDiv.innerText = `Wallet: ${userAddress}`;
    connectBtn.style.display = "none";
    disconnectBtn.style.display = "inline";

    verified = false; // при новом подключении нужно подтверждать

    // сразу предложить подписать сообщение
    verifyWallet();
  } catch (err) {
    console.error(err);
    walletDiv.innerText = "Ошибка подключения";
  }
};

// --- Отключение кошелька ---
disconnectBtn.onclick = () => {
  signer = null;
  userAddress = null;
  verified = false;
  walletDiv.innerText = "";
  connectBtn.style.display = "inline";
  disconnectBtn.style.display = "none";
};

// --- Подтверждение владения кошельком ---
async function verifyWallet() {
  if (!signer || !userAddress) return;

  const nonce = Date.now();
  const message = `🎮 Verify ownership of this wallet for Truth Table game
Wallet: ${userAddress}
Nonce: ${nonce}`;

  try {
    const signature = await signer.signMessage(message);

    // проверка подписи
    const recovered = ethers.verifyMessage(message, signature);
    if (recovered.toLowerCase() === userAddress.toLowerCase()) {
      verified = true;
      alert("✅ Wallet verified! You can now save your score.");
    } else {
      alert("❌ Signature does not match wallet!");
    }
  } catch (err) {
    console.error(err);
    alert("Wallet verification canceled or failed.");
  }
}

// --- Функция для game.js ---
window.isWalletVerified = () => verified;


window.saveScoreOnChain = async (score) => {
  if (!signer || !userAddress || !verified) {
    alert("Wallet not verified!");
    return false;
  }

  const nonce = Date.now();
  const message = `🎮 Save score for Truth Table
Wallet: ${userAddress}
Score: ${score}
Nonce: ${nonce}`;

  try {
    const signature = await signer.signMessage(message);

    const resp = await fetch("https://truth-table-base.onrender.com/save-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet: userAddress, score, message, signature })
    });

    const data = await resp.json();
    if (data.success) {
      alert("Score saved!");
      return true;
    } else {
      alert("Error saving score: " + data.error);
      return false;
    }
  } catch (err) {
    console.error(err);
    alert("Failed to save score");
    return false;
  }
};
