const API_URL =
  "https://script.google.com/macros/s/AKfycbzCO4TLMRGgt_OY-3T92mw58AAKcOwquq0ubepUEJgPO9YPeMV-hNeP7AHy7lvOPog7oQ/exec";

let allContracts = [];
let selectedContract = null;

window.onload = function () {
  normalizeTypeFilter();
  loadContracts();
};

function normalizeTypeFilter() {
  const typeFilter = document.getElementById("typeFilter");
  if (!typeFilter) return;

  typeFilter.innerHTML = `
    <option value="all">전체 계약</option>
    <option value="정규직">정규직 근로계약서</option>
    <option value="아르바이트">아르바이트 근로계약서</option>
    <option value="용역">사업소득자 용역계약서</option>
  `;
}

async function loadContracts() {
  const tbody = document.getElementById("contractTableBody");

  tbody.innerHTML = `
    <tr>
      <td colspan="10">계약 목록을 불러오는 중입니다...</td>
    </tr>
  `;

  try {
    const result = await postData({
      action: "getContractList"
    });

    if (!result.success) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10">${result.message || "계약 목록을 불러오지 못했습니다."}</td>
        </tr>
      `;
      return;
    }

    allContracts = result.contracts || [];
    renderContracts(allContracts);

  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10">오류가 발생했습니다: ${err.message}</td>
      </tr>
    `;
  }
}

function searchContracts() {
  const name = document.getElementById("searchName").value.trim();
  const status = document.getElementById("statusFilter").value;
  const type = document.getElementById("typeFilter").value;

  const filtered = allContracts.filter(c => {
    const contractType = String(c.contractType || "");

    const matchName =
      !name || String(c.employeeName || "").includes(name);

    let matchStatus = false;

      if(status === "all"){
        matchStatus = true;
      }else if(status === "재계약필요"){
        matchStatus = isContractRenewalNeeded(c.endDate, c.contractType);
      }else{
        matchStatus = c.status === status;
      }

    let matchType = false;

    if (type === "all") {
      matchType = true;
    } else if (type === "정규직") {
      matchType = contractType.includes("정규직");
    } else if (type === "아르바이트") {
      matchType =
        contractType.includes("아르바이트") ||
        contractType.includes("계약직");
    } else if (type === "계약직") {
      matchType =
        contractType.includes("계약직") ||
        contractType.includes("아르바이트");
    } else if (type === "용역") {
      matchType =
        contractType.includes("용역") ||
        contractType.includes("사업소득");
    } else {
      matchType = contractType.includes(type);
    }

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
        <td colspan="10">조회된 계약이 없습니다.</td>
      </tr>
    `;
    return;
  }

  list.forEach(c => {
    const isDone = c.status === "서명완료";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.contractId || ""}</td>
      <td>${displayContractType(c.contractType)}</td>
      <td>
        <span class="badge ${isDone ? "done" : "wait"}">
          ${c.status || ""}
        </span>
      </td>
      <td>${c.employeeName || ""}</td>
      <td>${c.phone || ""}</td>
      <td>${c.joinDate || ""}</td>
      <td>
        ${c.endDate || ""}
        ${getEndDateBadge(c.endDate, c.contractType)}
      </td>
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

function displayContractType(type) {
  const t = String(type || "");

  if (t.includes("아르바이트") || t.includes("계약직")) {
    return "계약직(아르바이트) 근로계약서";
  }

  if (t.includes("정규직")) {
    return "정규직 근로계약서";
  }

  if (t.includes("용역") || t.includes("사업소득")) {
    return "사업소득자 용역계약서";
  }

  return t;
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

  const contractType =
    result.contractType ||
    (result.contract && result.contract.contractType) ||
    "";

  const isPart =
    String(contractType).includes("계약직") ||
    String(contractType).includes("아르바이트");

  const isService =
    String(contractType).includes("용역") ||
    String(contractType).includes("사업소득");

  renderContractDetail(result, isPart, isService);

  document.getElementById("modal").style.display = "block";
}

function renderContractDetail(result, isPart, isService) {
  const c = result.contract || {};
  const signature = result.signature || "";

  let html = "";

  if (isService) {
    html = renderServiceContractDetail(c, signature, result);
  } else if (isPart) {
    html = renderPartContractDetail(c, signature, result);
  } else {
    html = renderRegularContractDetail(c, signature, result);
  }

  document.getElementById("contractDetail").innerHTML = html;
}

function renderPartContractDetail(c, signature, result) {
  return `
    <h1>계약직(아르바이트) 근로계약서</h1>

    <p>
      한국의집 롯데월드몰점(이하 “사업주”라 한다)과 근로자
      <strong>${c.empName || ""}</strong>
      (이하 “근로자”라 한다)은 다음과 같이 근로계약을 체결한다.
    </p>

    <h3>1. 근로계약기간</h3>
    <p>${c.startDate || c.joinDate || ""}부터 ${c.endDate || ""}까지</p>

    <h3>2. 근무장소</h3>
    <p>${c.workPlace || "한국의집 롯데월드몰점"}</p>

    <h3>3. 업무내용</h3>
    <p>${c.jobDuty || ""}</p>

    <h3>4. 근로시간</h3>
    <table class="detail-table">
      <tr>
        <th>근무일수</th>
        <th>출근시간</th>
        <th>퇴근시간</th>
        <th>휴게시간</th>
      </tr>
      <tr>
        <td>${c.workDays || ""}</td>
        <td>${c.startTime || ""}</td>
        <td>${c.endTime || ""}</td>
        <td>${c.breakTime || ""}</td>
      </tr>
    </table>

    <h3>5. 근무일 / 휴일</h3>
    <p>${c.workDays || ""} 근무 / 주휴일 : ${c.holiday || "선택 안함"}</p>

    <h3>6. 임금</h3>
    <table class="detail-table">
      <tr>
        <th>시급</th>
        <th>4대보험</th>
      </tr>
      <tr>
        <td>${won(c.hourPay || c.totalPay)}</td>
        <td>${c.insurance || ""}</td>
      </tr>
    </table>

    <p>회사는 매월 1일부터 말일까지의 기간 동안 산정한 급여를 익월 10일에 근로자 명의의 은행계좌로 송금한다.</p>
    <p>급여 지급 시 갑근세, 사회보험료 등 법정공제액은 공제 후 지급한다.</p>

    <h3>7. 4대보험 가입유무</h3>
    <p>근로자는 4대보험 가입 여부에 대하여 <strong>${c.insurance || ""}</strong> 의사를 표시한다.</p>

    <h3>8. 근로계약서 교부</h3>
    <p>근로자는 본 근로계약서를 전자문서 방식으로 교부받았음을 확인한다.</p>

    <h3>9. CCTV 설치 동의</h3>
    <p>근로자는 방범, 화재예방, 시설안전관리 목적의 CCTV 설치 및 운영에 대해 충분히 설명을 듣고 동의한다.</p>

    <h3>10. 전자계약 및 전자서명</h3>
    <p>사업주와 근로자는 본 계약이 전자문서 및 전자서명 방식으로 체결될 수 있음을 확인하며, 전자서명은 자필서명 또는 날인과 동일한 효력을 가진다.</p>

    ${signAdminBox(c, signature, result, "사업주", "근로자")}
  `;
}

function renderRegularContractDetail(c, signature, result) {
  return `
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
        <td>${won(c.basePay)}</td>
        <td>${won(c.overtimePay)}</td>
        <td>${won(c.dutyPay)}</td>
        <td>${won(c.positionPay)}</td>
        <td>${won(c.mealPay)}</td>
        <td><strong>${won(c.totalPay)}</strong></td>
      </tr>
    </table>

    <h3>제6조 제출서류</h3>
    <p>직원은 채용과 동시에 주민등록등본, 보건증, 통장사본, 신분증사본 등 회사가 요청하는 서류를 제출한다.</p>

    <h3>제7조 퇴직급여</h3>
    <p>회사는 근로자퇴직급여보장법이 정한 바에 따라 퇴직급여를 지급한다.</p>

    <h3>제8조 퇴직절차</h3>
    <p>직원은 퇴직하고자 할 경우 사직원을 사전 제출하여야 한다.</p>

    <h3>제9조 신의성실의무</h3>
    <p>직원은 회사의 경영방침에 따라 신의와 성실로 근무하여야 하며, 회사의 영업기밀사항을 외부에 누설하여서는 아니 된다.</p>

    <h3>제10조 CCTV 설치 동의</h3>
    <p>직원은 방범, 화재예방, 시설안전관리 목적의 CCTV 설치 및 운영에 대해 충분히 설명을 듣고 이해 및 동의한다.</p>

    <h3>제11조 전자계약 및 계약서 교부 확인</h3>
    <p>회사와 직원은 본 계약이 전자문서 및 전자서명 방식으로 체결될 수 있음을 확인하며, 전자서명은 자필서명 또는 날인과 동일한 효력을 가진다.</p>

    <h3>제12조 기타사항</h3>
    <p>본 계약서에 명시되지 않은 사항은 근로기준법, 관계 법령, 취업규칙 및 판례가 정하는 바에 따른다.</p>

    ${signAdminBox(c, signature, result, "회사", "근로자")}
  `;
}

function renderServiceContractDetail(c, signature, result) {
  return `
    <h1>사업소득자 용역계약서</h1>

    <p>
      한국의집 롯데월드몰점(이하 “사업자”라 한다)과 용역제공자
      <strong>${c.empName || ""}</strong>
      (이하 “제공자”라 한다)은 다음과 같이 용역계약을 체결한다.
    </p>

    <h3>제1조 계약기간</h3>
    <p>${c.startDate || c.joinDate || ""}부터 ${c.endDate || ""}까지</p>

    <h3>제2조 용역장소 및 업무내용</h3>
    <p>① 용역장소 : ${c.workPlace || "한국의집 롯데월드몰점"}</p>
    <p>② 업무내용 : ${c.jobDuty || ""}</p>

    <h3>제3조 용역비</h3>
    <table class="detail-table">
      <tr>
        <th>지급기준</th>
        <th>금액</th>
      </tr>
      <tr>
        <td>${c.payType || "건별/시간별"}</td>
        <td>${won(c.totalPay || c.hourPay)}</td>
      </tr>
    </table>

    <h3>제4조 전자계약 및 전자서명</h3>
    <p>본 계약은 전자문서 및 전자서명 방식으로 체결될 수 있으며, 전자서명은 자필서명 또는 날인과 동일한 효력을 가진다.</p>

    ${signAdminBox(c, signature, result, "사업자", "제공자")}
  `;
}

function signAdminBox(c, signature, result, companyLabel, workerLabel) {
  return `
    <h3>전자서명 정보</h3>
    <p>계약번호 : ${result.contractId || ""}</p>
    <p>계약상태 : ${result.status || ""}</p>
    <p>서명일시 : ${result.signedAt || "-"}</p>

    <div class="sign-admin-box">
      <div>
        <h3>[${companyLabel}]</h3>
        <p>상호 : 한국의집 롯데월드몰점</p>
        <p>대표 : 박병호</p>
        <p>주소 : 서울시 송파구 올림픽로 300, 5층</p>
        <p>연락처 : 070-5015-7233</p>
        <img class="company-stamp"
        src="https://thebigkorea.github.io/hr-system/stamp.png"
        style="width:90px;height:auto;display:block;margin-top:12px;">
        </div>

      <div>
        <h3>[${workerLabel}]</h3>
        <p>성명 : ${c.empName || ""}</p>
        <p>주민등록번호 : ${c.residentNo || ""}</p>
        <p>생년월일 : ${c.birth || ""}</p>
        <p>주소 : ${c.address || ""}</p>
        <p>연락처 : ${c.phone || ""}</p>
        <p>근로자 전자서명</p>
        ${
          signature
            ? `<img class="signature-img" src="${signature}" alt="근로자 전자서명">`
            : `<p>아직 서명 이미지가 없습니다.</p>`
        }
      </div>
    </div>
  `;
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

function won(v) {
  if (!v) return "0원";
  return String(v).includes("원") ? v : `${v}원`;
}
function getEndDateBadge(endDate, contractType) {
  if (!endDate) return "";

  const type = String(contractType || "");

  if (
    !type.includes("계약직") &&
    !type.includes("아르바이트") &&
    !type.includes("용역") &&
    !type.includes("사업소득")
  ) {
    return "";
  }

  const end = parseKoreanDate(endDate);
  if (!end) return "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diff =
    Math.ceil((end - today) / (1000 * 60 * 60 * 24));

  if (diff < 0) {
    return `<span class="end-badge red">계약만료</span>`;
  }

  if (diff <= 7) {
    return `<span class="end-badge orange">재계약필요</span>`;
  }

  if (diff <= 30) {
    return `<span class="end-badge yellow">만료임박</span>`;
  }

  return "";
}

function parseKoreanDate(value) {
  const text = String(value || "").trim();

  let m = text.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  m = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  const d = new Date(text);
  if (isNaN(d.getTime())) return null;

  d.setHours(0, 0, 0, 0);
  return d;
}

function isContractRenewalNeeded(endDate, contractType){
  if(!endDate) return false;

  const type = String(contractType || "");

  if(
    !type.includes("계약직") &&
    !type.includes("아르바이트") &&
    !type.includes("용역") &&
    !type.includes("사업소득")
  ){
    return false;
  }

  const end = parseKoreanDate(endDate);
  if(!end) return false;

  const today = new Date();
  today.setHours(0,0,0,0);

  const diff =
    Math.ceil((end - today) / (1000 * 60 * 60 * 24));

  return diff <= 7;
}