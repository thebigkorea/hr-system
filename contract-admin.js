const API_URL =
  "https://script.google.com/macros/s/AKfycbzCO4TLMRGgt_OY-3T92mw58AAKcOwquq0ubepUEJgPO9YPeMV-hNeP7AHy7lvOPog7oQ/exec";

let allContracts = [];
let selectedContract = null;

window.onload = function () {
  loadContracts();
};

async function loadContracts() {
  const tbody = document.getElementById("contractTableBody");
  tbody.innerHTML = `
    <tr>
      <td colspan="9">계약 목록을 불러오는 중입니다...</td>
    </tr>
  `;

  try {
    const result = await postData({
      action: "getContractList"
    });

    if (!result.success) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9">${result.message || "계약 목록을 불러오지 못했습니다."}</td>
        </tr>
      `;
      return;
    }

    allContracts = result.contracts || [];
    renderContracts(allContracts);

  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9">오류가 발생했습니다: ${err.message}</td>
      </tr>
    `;
  }
}

function searchContracts() {
  const name = document.getElementById("searchName").value.trim();
  const status = document.getElementById("statusFilter").value;
  const type = document.getElementById("typeFilter").value;

  const filtered = allContracts.filter(c => {
    const matchName = !name || String(c.employeeName || "").includes(name);
    const matchStatus = status === "all" || c.status === status;
    const matchType = type === "all" || c.contractType === type;

    return matchName && matchStatus && matchType;
  });

  renderContracts(filtered);
}

function resetSearch() {
  document.getElementById("searchName").value = "";
  document.getElementById("statusFilter").value = "all";
  document.getElementById("typeFilter").value = "all";

  renderContracts(allContracts);
}

function renderContracts(list) {
  const tbody = document.getElementById("contractTableBody");
  tbody.innerHTML = "";

  if (!list || list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9">조회된 계약이 없습니다.</td>
      </tr>
    `;
    return;
  }

  list.forEach(c => {
    const isDone = c.status === "서명완료";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.contractId || ""}</td>
      <td>${c.contractType || ""}</td>
      <td>
        <span class="badge ${isDone ? "done" : "wait"}">
          ${c.status || ""}
        </span>
      </td>
      <td>${c.employeeName || ""}</td>
      <td>${c.phone || ""}</td>
      <td>${c.joinDate || ""}</td>
      <td>${c.createdAt || ""}</td>
      <td>${c.signedAt || "-"}</td>
      <td>
        <div class="action-buttons">
          <button onclick="openContract('${c.contractId}')">원본보기</button>
          <button class="green" onclick="copyLink('${c.workerLink || ""}')">링크복사</button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

async function openContract(contractId) {
  const result = await postData({
    action: "getContractById",
    contractId
  });

  if (!result.success) {
    alert(result.message || "계약서를 불러오지 못했습니다.");
    return;
  }

  selectedContract = result;
  renderContractDetail(result);
  document.getElementById("modal").style.display = "block";
}

function renderContractDetail(result) {
  const c = result.contract || {};
  const signature = result.signature || "";

  const html = `
    <h1>근 로 계 약 서</h1>

    <p>
      한국의집 롯데월드몰점(이하 “회사”라 한다)과 근로자
      <strong>${c.empName || ""}</strong>
      (이하 “직원”이라 한다)은 다음과 같이 근로계약을 체결하고 이를 성실히 이행할 것을 약정한다.
    </p>

    <h3>제1조 계약기간</h3>
    <p>입사일 : ${c.joinDate || ""}</p>
    <p>입사일로부터 기간의 정함이 없는 근로계약을 체결한다. 수습기간은 3개월로 한다.</p>

    <h3>제2조 근무장소 및 업무내용</h3>
    <p>① 근무장소 : ${c.workPlace || ""}</p>
    <p>② 업무내용 : ${c.jobDuty || ""}</p>

    <h3>제3조 근로시간 및 휴게</h3>
    <table class="detail-table">
      <tr>
        <th>근무일수</th>
        <th>월 기준시간</th>
        <th>근무시간</th>
        <th>휴게시간</th>
      </tr>
      <tr>
        <td>${c.workDays || ""}</td>
        <td>${c.monthHour || ""}</td>
        <td>${c.workTime || ""}</td>
        <td>${c.breakTime || ""}</td>
      </tr>
    </table>

    <h3>제4조 임금</h3>
    <table class="detail-table">
      <tr>
        <th>기본급</th>
        <th>연장수당</th>
        <th>직무수당</th>
        <th>직책수당</th>
        <th>식대</th>
        <th>월급총액</th>
      </tr>
      <tr>
        <td>${c.basePay || ""}</td>
        <td>${c.overtimePay || ""}</td>
        <td>${c.dutyPay || ""}</td>
        <td>${c.positionPay || ""}</td>
        <td>${c.mealPay || ""}</td>
        <td><strong>${c.totalPay || ""}</strong></td>
      </tr>
    </table>

    <h3>직원 기본정보</h3>
    <table class="detail-table">
      <tr>
        <th>성명</th>
        <td>${c.empName || ""}</td>
        <th>주민등록번호</th>
        <td>${c.residentNo || ""}</td>
      </tr>
      <tr>
        <th>생년월일</th>
        <td>${c.birth || ""}</td>
        <th>연락처</th>
        <td>${c.phone || ""}</td>
      </tr>
      <tr>
        <th>주소</th>
        <td colspan="3">${c.address || ""}</td>
      </tr>
      <tr>
        <th>급여계좌</th>
        <td colspan="3">${c.bank || ""} ${c.account || ""}</td>
      </tr>
    </table>

    <h3>전자서명 정보</h3>
    <p>계약번호 : ${result.contractId || ""}</p>
    <p>계약상태 : ${result.status || ""}</p>
    <p>서명일시 : ${result.signedAt || "-"}</p>

    <div>
      <p><strong>근로자 전자서명</strong></p>
      ${
        signature
          ? `<img class="signature-img" src="${signature}" alt="근로자 전자서명">`
          : `<p>아직 서명 이미지가 없습니다.</p>`
      }
    </div>

    <h3>회사 확인</h3>
    <p>상호 : 한국의집 롯데월드몰점</p>
    <p>대표자 : 박병호</p>
    <p>주소 : 서울시 송파구 올림픽로 300, 5층</p>
  `;

  document.getElementById("contractDetail").innerHTML = html;
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

function printContract() {
  window.print();
}

function copyWorkerLink() {
  if (!selectedContract || !selectedContract.workerLink) {
    alert("복사할 직원 링크가 없습니다.");
    return;
  }

  copyText(selectedContract.workerLink);
  alert("직원 링크가 복사되었습니다.");
}

function copyLink(link) {
  if (!link) {
    alert("복사할 링크가 없습니다.");
    return;
  }

  copyText(link);
  alert("직원 링크가 복사되었습니다.");
}

function copyText(text) {
  const temp = document.createElement("input");
  document.body.appendChild(temp);
  temp.value = text;
  temp.select();
  document.execCommand("copy");
  document.body.removeChild(temp);
}

async function postData(data) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(data)
  });

  return await response.json();
}