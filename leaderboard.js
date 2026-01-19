let currentPage = 1;

async function loadLeaderboard(page = 1) {
  const resp = await fetch(`http://localhost:3000/leaderboard?page=${page}`);
  const data = await resp.json();

  // Если данных нет — возвращаем false и не меняем таблицу
  if (!data.data || data.data.length === 0) {
    return false;
  }

  const tbody = document.querySelector("#leaderboardTable tbody");
  tbody.innerHTML = ""; // очищаем только если есть новые данные

  data.data.forEach((row, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${(page-1)*10 + index + 1}</td>
      <td>${row.wallet}</td>
      <td>${row.score}</td>
    `;
    tbody.appendChild(tr);
  });

  return true; // есть данные
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadLeaderboard(currentPage);

  const leaderboardDiv = document.querySelector(".leaderboard");

  const prevBtn = document.createElement("button");
  prevBtn.innerText = "Prev";
  const nextBtn = document.createElement("button");
  nextBtn.innerText = "Next";

  leaderboardDiv.appendChild(prevBtn);
  leaderboardDiv.appendChild(nextBtn);

  prevBtn.onclick = async () => {
    if(currentPage > 1){
      const success = await loadLeaderboard(currentPage - 1);
      if(success) currentPage--;
    }
  };

  nextBtn.onclick = async () => {
    const success = await loadLeaderboard(currentPage + 1);
    if(success) {
      currentPage++;
    } else {
      alert("No more players on next page.");
    }
  };
});
