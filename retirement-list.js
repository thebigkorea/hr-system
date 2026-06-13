const API_URL =
  "https://script.google.com/macros/s/AKfycbzhbRFVeN7NYCGSP4AJopaZRmaib_22aBTP3j3pDcQrmlgMlHe4y27XVZCzKizw4COKJg/exec";

document.addEventListener(
  "DOMContentLoaded",
  loadRetirementList
);

async function loadRetirementList() {

  const box =
    document.getElementById("retirementList");

  box.innerHTML = "불러오는 중...";

  try {

    const res = await fetch(
      API_URL + "?action=list"
    );

    const json = await res.json();

    if (!json.success) {

      box.innerHTML =
        "목록 조회 실패";

      return;
    }

    let list =
      json.data || [];

    const searchStore =
      document.getElementById("searchStore").value;

    const searchType =
      document.getElementById("searchType").value;

    if (searchStore) {

      list = list.filter(
        item => item.store === searchStore
      );
    }

    if (searchType) {

      list = list.filter(
        item => item.type === searchType
      );
    }

    if (list.length === 0) {

      box.innerHTML = `
        <div class="empty">
          조회 결과가 없습니다.
        </div>
      `;

      return;
    }

    box.innerHTML =
      list.map(renderItem).join("");

  } catch(err) {

    box.innerHTML =
      "조회 중 오류가 발생했습니다.";
  }
}

function renderItem(item) {

  const statusClass =
    item.status === "서명완료"
      ? "done"
      : "wait";

  return `
    <div class="list-item">

      <h3>
        ${escapeHtml(item.name)}
      </h3>

      <div class="info">

        <div>
          점포:
          ${escapeHtml(item.store)}
        </div>

        <div>
          퇴직유형:
          ${escapeHtml(item.type)}
        </div>

        <div>
          직위:
          ${escapeHtml(item.position)}
        </div>

        <div>
          입사일:
          ${escapeHtml(item.joinDate)}
        </div>

        <div>
          퇴직예정일:
          ${escapeHtml(item.retireDate)}
        </div>

        <div>
          연락처:
          ${escapeHtml(item.phone)}
        </div>

        <div>
          관리자:
          ${escapeHtml(item.manager)}
        </div>

        <div>
          등록일시:
          ${escapeHtml(item.createdAt)}
        </div>

      </div>

      <div class="status ${statusClass}">
        ${escapeHtml(item.status)}
      </div>

      <div style="margin-top:16px;">

  <a href="retirement-print.html?id=${item.retireId}"
     target="_blank"
     class="print-btn">

     출력하기

  </a>

</div>

      <div class="link-box">

        <div>
          직원 서명 링크
        </div>

        <br>

        <a href="${item.signLink}"
           target="_blank">

          ${item.signLink}

        </a>

      </div>

    </div>
  `;
}

function escapeHtml(value) {

  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}