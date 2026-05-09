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
          <button class="green" onclick="copyViewLink('${c.workerLink || ""}', '${c.contractId || ""}')">
            완료본 링크복사
          </button>
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
    <p>③ 회사는 필요한 경우 직원의 의견을 들어 업무내용을 변경할 수 있다.</p>

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

    <h3>제4조 휴일 및 휴가</h3>
    <p>① 법정유급휴일은 주휴일 및 근로자의 날로 한다.</p>
    <p>② 근로기준법이 정하는 바에 따라 연차휴가를 부여한다.</p>

    <h3>제5조 임금</h3>
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

    <p>② 회사는 매월 1일부터 말일까지의 기간 동안 산정한 월 급여를 익월 10일에 직원 명의의 은행계좌로 송금한다.</p>
    <p>③ 급여 지급 시 갑근세, 사회보험료 등 법정 공제액은 공제 후 지급한다.</p>

    <h3>제6조 제출서류</h3>
    <p>직원은 채용과 동시에 주민등록등본, 보건증, 통장사본, 신분증사본 등 회사가 요청하는 서류를 제출한다.</p>

    <h3>제7조 퇴직급여</h3>
    <p>회사는 근로자퇴직급여보장법이 정한 바에 따라 퇴직급여를 지급한다.</p>

    <h3>제8조 퇴직절차</h3>
    <p>직원은 퇴직하고자 할 경우 사직원을 사전 제출하여야 한다.</p>

    <h3>제9조 신의성실의무</h3>
    <p>
      직원은 회사의 경영방침에 따라 신의와 성실로 근무하여야 하며,
      회사의 영업기밀사항을 외부에 누설하여서는 아니 된다.
    </p>

    <h3>제10조 CCTV 설치 동의</h3>
    <p>
      직원은 방범, 화재예방, 시설안전관리 목적의 CCTV 설치 및 운영에 대해
      충분히 설명을 듣고 이해 및 동의한다.
    </p>

    <h3>제11조 전자계약 및 계약서 교부 확인</h3>
    <p>
      회사와 직원은 본 계약이 전자문서 및 전자서명 방식으로 체결될 수 있음을 확인하며,
      전자서명은 자필서명 또는 날인과 동일한 효력을 가진다.
    </p>

    <h3>제12조 기타사항</h3>
    <p>본 계약서에 명시되지 않은 사항은 근로기준법, 관계 법령, 취업규칙 및 판례가 정하는 바에 따른다.</p>

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

    <div class="sign-admin-box">
      <div>
        <h3>[회사]</h3>
        <p>상호 : 한국의집 롯데월드몰점</p>
        <p>대표 : 박병호</p>
        <p>주소 : 서울시 송파구 올림픽로 300, 5층</p>
        <p>연락처 : 070-5015-7233</p>
        <img class="company-stamp" src="https://thebigkorea.github.io/hr-system/stamp.png">
      </div>

      <div>
        <h3>[근로자]</h3>
        <p>성명 : ${c.empName || ""}</p>
        <p>근로자 전자서명</p>
        ${
          signature
            ? `<img class="signature-img" src="${signature}" alt="근로자 전자서명">`
            : `<p>아직 서명 이미지가 없습니다.</p>`
        }
      </div>
    </div>
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

  const viewLink = makeViewLink(selectedContract.workerLink, selectedContract.contractId);

  copyText(viewLink);
  alert("완료된 계약서 열람 링크가 복사되었습니다.");
}

function copyViewLink(link, contractId) {
  const viewLink = makeViewLink(link, contractId);

  if (!viewLink) {
    alert("복사할 링크가 없습니다.");
    return;
  }

  copyText(viewLink);
  alert("완료된 계약서 열람 링크가 복사되었습니다.");
}

function makeViewLink(link, contractId) {
  let id = contractId || "";

  if (!id && link) {
    const match = link.match(/[?&]id=([^&]+)/);
    if (match) id = decodeURIComponent(match[1]);
  }

  if (!id) return "";

  return `https://thebigkorea.github.io/hr-system/contract-view.html?id=${encodeURIComponent(id)}&v=${Date.now()}`;
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