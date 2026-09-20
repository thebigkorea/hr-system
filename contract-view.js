const API_URL =
"https://script.google.com/macros/s/AKfycbwRGQcXgYhfkTUiklPrHs4uFe7oHpgn8D_jM2jJPpU74tXr3D_h6vGMq72CHXU0EnAb/exec";

let CURRENT_CONTRACT_ID = "";
let CURRENT_PUBLIC_TOKEN = "";
let HAS_DRAWN = false;

window.onload = loadContractView;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getVal(c, keys, fallback = "") {
  for (const key of keys) {
    if (c && c[key] !== undefined && c[key] !== null && String(c[key]).trim() !== "") {
      return escapeHtml(c[key]);
    }
  }
  return escapeHtml(fallback);
}

async function loadContractView() {
  const contractId = getParam("id");
  const publicToken = getParam("token");
  CURRENT_CONTRACT_ID = contractId;
  CURRENT_PUBLIC_TOKEN = publicToken || "";

  if (!contractId || !publicToken) {
    showError("유효한 계약서 링크가 아닙니다.");
    return;
  }

  try {
    const result = await postData({
      action: "getContractById",
      contractId,
      publicToken: CURRENT_PUBLIC_TOKEN
    });

    if (!result.success) {
      showError(result.message || "계약서를 불러오지 못했습니다.");
      return;
    }

    const c = result.contract || result.data || result.draft || {};
    const signature =
      result.signature ||
      c.signature ||
      c.signImage ||
      "";

    const status =
      result.status ||
      c.status ||
      "서명대기";

    const isSigned =
      String(status).includes("완료") ||
      String(result.signedAt || c.signedAt || "").length > 1 ||
      String(signature || "").length > 20;

    document.getElementById("loading").style.display = "none";
    document.getElementById("contractWrap").style.display = "block";

    document.getElementById("pageTitle").innerText =
      isSigned ? "전자근로계약 완료본" : "전자근로계약 서명요청서";

    document.getElementById("contractContent").innerHTML =
      renderContractHtml(c, result, signature, isSigned);

    if (!isSigned) {
      setTimeout(setupSignatureCanvas, 100);
    }

  } catch (err) {
    showError("오류가 발생했습니다: " + err.message);
  }
}

function renderServiceView(c, result, signature, isSigned) {
  const companyName = getVal(c, ["companyName"], "주식회사 더큰코리아");
  const empName = getVal(c, ["empName", "name", "employeeName"]);
  const startDate = getVal(c, ["startDate", "contractStartDate", "periodStart", "joinDate"]);
  const endDate = getVal(c, ["endDate", "contractEndDate", "periodEnd"]);
  const workPlace = getVal(c, ["workPlace", "workplace", "store", "workLocation"]);
  const jobDuty = getVal(c, ["jobDuty", "workDetail", "job", "duty", "memo"]);
  const totalPay = getVal(c, ["totalPay", "salary", "monthlySalary"]);
  const payType = getVal(c, ["payType"], "월별");
  const withholding = getVal(c, ["withholding"], "3.3% 원천징수 후 지급");
  const payDate = getVal(c, ["payDate"], "익월 10일");
  const bankName = getVal(c, ["bankName", "bank", "salaryBank"]);
  const bankAccount = getVal(c, ["bankAccount", "account", "salaryAccount"]);

  const residentNo = getVal(c, ["residentNo", "rrn", "ssn"]);
  const address = getVal(c, ["address"]);
  const phone = getVal(c, ["phone"]);
  const companyRepresentative = getVal(c, ["companyRepresentative"], "박병호");
  const companyAddress = getVal(c, ["companyAddress"], "");
  const companyPhone = getVal(c, ["companyPhone"], "");

  return `
    <h1>사업소득자 용역계약서</h1>

    <p>
      <strong>${companyName}</strong>(이하 “사업자”라 한다)와 용역제공자
      <strong>${empName}</strong>(이하 “제공자”라 한다)은 다음과 같이 용역계약을 체결한다.
    </p>

    <h3>제1조 계약기간</h3>
    <p>${startDate}부터 ${endDate}까지</p>

    <h3>제2조 용역장소 및 용역내용</h3>
    <p>① 용역장소 : ${workPlace}</p>
    <p>② 용역내용 : ${jobDuty}</p>

    <h3>제3조 용역비</h3>
    <table>
      <tr>
        <th>지급기준</th>
        <th>용역비</th>
        <th>원천징수</th>
        <th>지급일</th>
      </tr>
      <tr>
        <td>${payType}</td>
        <td>${won(totalPay)}</td>
        <td>${withholding}</td>
        <td>${payDate}</td>
      </tr>
    </table>

    <h3>제4조 지급방법</h3>
    <p>사업자는 제공자 명의의 은행계좌로 용역비를 지급한다.</p>
    <p>지급은행 : ${bankName}</p>
    <p>계좌번호 : ${bankAccount}</p>

    <h3>제5조 독립 용역제공자 지위</h3>
    <p>제공자는 근로기준법상 근로자가 아닌 독립적인 용역제공자로서, 본 계약은 고용계약이 아닌 용역계약임을 확인한다.</p>

    <h3>제6조 세금 및 신고</h3>
    <p>사업자는 관계 법령에 따라 용역비 지급 시 원천징수세액을 공제할 수 있으며, 제공자는 이에 필요한 개인정보 및 계좌정보를 제공한다.</p>

    <h3>제7조 비밀유지</h3>
    <p>제공자는 용역 수행 과정에서 알게 된 사업자의 영업정보, 고객정보, 운영정보를 제3자에게 누설하여서는 아니 된다.</p>

    <h3>제8조 전자계약 및 전자서명</h3>
    <p>본 계약은 전자문서 및 전자서명 방식으로 체결될 수 있으며, 전자서명은 자필서명 또는 날인과 동일한 효력을 가진다.</p>

    <h3>제9조 기타사항</h3>
    <p>본 계약서에 명시되지 않은 사항은 민법, 상법 및 관계 법령에 따른다.</p>

    <h3>사업자 및 제공자 서명</h3>

    <div class="sign-area">
      <div class="sign-box">
        <h3>[사업자]</h3>
        <p>상호 : ${companyName}</p>
        <p>
          대표자 : ${companyRepresentative}
          <img class="stamp" src="stamp.png" alt="회사 직인">
        </p>
        <p>주소 : ${companyAddress}</p>
        <p>연락처 : ${companyPhone}</p>
      </div>

      <div class="sign-box">
        <h3>[제공자]</h3>
        <p>성명 : ${empName}</p>
        <p>주민등록번호 : ${residentNo}</p>
        <p>주소 : ${address}</p>
        <p>연락처 : ${phone}</p>
        ${
          isSigned
            ? `
              <p>서명일시 : ${result.signedAt || c.signedAt || ""}</p>
              ${signature ? `<img class="signature-img" src="${signature}" alt="전자서명">` : ""}
            `
            : `
              <p style="margin-top:24px;">아래 전자서명란에 서명 후 완료 버튼을 눌러주세요.</p>
            `
        }
      </div>
    </div>

    ${
      isSigned
        ? `<div class="bottom-buttons"><button class="blue" onclick="printContract()">인쇄 / PDF 저장</button></div>`
        : renderSignatureInput()
    }
  `;
}

function renderContractHtml(c, result, signature, isSigned) {
  const companyName = getVal(c, ["companyName"], "주식회사 더큰코리아");

  const contractType = getVal(c, [
    "contractType",
    "employmentType",
    "type",
    "contractKind"
  ], "");

  const isService =
    contractType.includes("용역") ||
    contractType.includes("사업소득");

  if (isService) {
    return renderServiceView(c, result, signature, isSigned);
  }

  const hourPay = getVal(c, ["hourPay", "hourlyPay", "hourlyWage"]);
  const empName = getVal(c, ["empName", "name", "employeeName"]);
  const workPlace = getVal(c, ["workPlace", "workplace", "store", "workLocation"]);
  const jobDuty = getVal(c, ["jobDuty", "workDetail", "job", "duty", "memo"]);
  const workDays = getVal(c, ["workDays", "weeklyDays"]);
  const monthHour = getVal(c, ["monthHour", "monthlyHours", "standardHours"]);
  const workTime = getVal(c, ["workTime", "workingHours"]);
  const breakTime = getVal(c, ["breakTime", "restTime"]);
 
  const basePay =getVal(c, ["basePay","baseSalary","basicSalary"]);
  const overtimePay = getVal(c, ["overtimePay", "overPay", "extensionPay"]);
  const dutyPay = getVal(c, ["dutyPay", "jobPay"]);
  const positionPay = getVal(c, ["positionPay", "rankPay"]);
  const mealPay = getVal(c, ["mealPay", "foodPay"]);
  const totalPay = getVal(c, ["totalPay", "salary", "monthlySalary", "totalSalary"]);

  const bankName = getVal(c, ["bankName", "bank", "salaryBank"]);
  const bankAccount = getVal(c, ["bankAccount", "account", "salaryAccount"]);

  const joinDate = getVal(c, ["joinDate", "startDate"]);
  const residentNo = getVal(c, ["residentNo", "rrn", "ssn"]);
  const address = getVal(c, ["address"]);
  const phone = getVal(c, ["phone"]);

  const companyRepresentative = getVal(c, ["companyRepresentative"], "박병호");
  const companyAddress = getVal(c, ["companyAddress"], "");
  const companyPhone = getVal(c, ["companyPhone"], "");

  if (isService) {
  return renderServiceView(c, result, signature, isSigned);
}

  return `
    <h1>근 로 계 약 서</h1>

    <p>
      <strong>${companyName}</strong>(이하 “회사”라 한다)과 근로자
      <strong>${empName}</strong>
      (이하 “직원”이라 한다)은 다음과 같이 근로계약을 체결하고 이를 성실히 이행할 것을 약정한다.
    </p>

    <h3>제1조 계약기간</h3>

${
  contractType &&
  contractType.includes("계약")
  ? `
    <p>계약 시작일 : ${c.startDate || c.contractStartDate || ""}</p>
    <p>계약 종료일 : ${c.endDate || c.contractEndDate || ""}</p>
  `
  : `
    <p>입사일 : ${joinDate}</p>
    <p>
      입사일로부터 기간의 정함이 없는 근로계약을 체결한다.
      수습기간은 3개월로 한다.
    </p>
  `
}

    <h3>제2조 근무장소 및 업무내용</h3>
    <p>① 근무장소 : ${workPlace}</p>
    <p>② 업무내용 : ${jobDuty}</p>

    <h3>제3조 근로시간 및 휴게</h3>
    <table>
      <tr>
        <th>주 근무일수</th>
        <th>월 기준시간</th>
        <th>근무시간</th>
        <th>휴게시간</th>
      </tr>
      <tr>
        <td>${workDays}</td>
        <td>${monthHour}</td>
        <td>${workTime}</td>
        <td>${breakTime}</td>
      </tr>
    </table>

    <h3>제4조 휴일 및 휴가</h3>
    <p>① 법정유급휴일은 주휴일 및 근로자의 날로 한다.</p>
    <p>② 회사는 근로기준법이 정하는 바에 따라 연차휴가를 부여한다.</p>

    
   ${
  contractType && contractType.includes("계약")
  ? `

<h3>제5조 임금</h3>

<table>
<tr>
<th>시급</th>
<th>주휴수당</th>
<th>4대보험</th>
</tr>

<tr>
<td>${won(hourPay)}</td>
<td>${c.weeklyHolidayPay || "포함"}</td>
<td>${c.insurance || "가입"}</td>
</tr>
</table>
`
:
`
<h3>제5조 임금</h3>

<table>
<tr>
<th>기본급</th>
<th>연장수당</th>
<th>직무수당</th>
<th>직책수당</th>
<th>식대</th>
<th>월급총액</th>
</tr>

<tr>
<td>${won(basePay)}</td>
<td>${won(overtimePay)}</td>
<td>${won(dutyPay)}</td>
<td>${won(positionPay)}</td>
<td>${won(mealPay)}</td>
<td><strong>${won(totalPay)}</strong></td>
</tr>
</table>
`
}

    <h3>제6조 임금지급방법</h3>
    <p>
      회사는 매월 1일부터 말일까지의 기간 동안 산정한 급여를 익월 10일에
      직원 명의의 은행계좌로 지급한다.
    </p>
    <p>급여은행 : ${bankName}</p>
    <p>계좌번호 : ${bankAccount}</p>

    <h3>제7조 제출서류</h3>
    <p>직원은 채용과 동시에 주민등록등본, 보건증, 통장사본, 신분증사본 등 회사가 요청하는 서류를 제출한다.</p>

    <h3>제8조 퇴직급여</h3>
    <p>회사는 근로자퇴직급여보장법이 정한 바에 따라 퇴직급여를 지급한다.</p>

    <h3>제9조 퇴직절차</h3>
    <p>직원은 퇴직하고자 할 경우 사직원을 사전 제출하여야 한다.</p>

    <h3>제10조 신의성실의무</h3>
    <p>직원은 회사의 경영방침에 따라 신의와 성실로 근무하여야 하며, 회사의 영업기밀사항을 외부에 누설하여서는 아니 된다.</p>

    <h3>제11조 CCTV 설치 동의</h3>
    <p>직원은 방범, 화재예방, 시설안전관리 목적의 CCTV 설치 및 운영에 대해 충분히 설명을 듣고 이해 및 동의한다.</p>

    <h3>제12조 전자계약 및 계약서 교부 확인</h3>
    <p>회사와 직원은 본 계약이 전자문서 및 전자서명 방식으로 체결될 수 있음을 확인하며, 전자서명은 자필서명 또는 날인과 동일한 효력을 가진다.</p>

    <h3>제13조 기타사항</h3>
    <p>본 계약서에 명시되지 않은 사항은 근로기준법, 관계 법령, 취업규칙 및 판례가 정하는 바에 따른다.</p>

    <h3>사용자 및 근로자 서명</h3>

    <div class="sign-area">
      <div class="sign-box">
        <h3>[회사]</h3>
        <p>상호 : ${companyName}</p>
        <p>
          대표자 : ${companyRepresentative}
          <img class="stamp" src="stamp.png" alt="회사 직인">
        </p>
        <p>주소 : ${companyAddress}</p>
        <p>연락처 : ${companyPhone}</p>
      </div>

      <div class="sign-box">
        <h3>[근로자]</h3>
        <p>성명 : ${empName}</p>
        <p>주민등록번호 : ${residentNo}</p>
        <p>주소 : ${address}</p>
        <p>연락처 : ${phone}</p>
        ${
          isSigned
            ? `
              <p>서명일시 : ${result.signedAt || c.signedAt || ""}</p>
              ${signature ? `<img class="signature-img" src="${signature}" alt="근로자 전자서명">` : ""}
            `
            : `
              <p style="margin-top:24px;">아래 전자서명란에 서명 후 완료 버튼을 눌러주세요.</p>
            `
        }
      </div>
    </div>

    ${
      isSigned
        ? `
          <div class="bottom-buttons">
           <button class="blue" onclick="printContract()">인쇄 / PDF 저장</button>
          </div>
        `
        : renderSignatureInput()
    }
  `;
}

function renderSignatureInput() {
  return `
    <div class="signature-guide">
      본 계약 내용을 모두 확인하였으며, 아래 서명란에 전자서명합니다.
    </div>

    <canvas id="signatureCanvas" width="900" height="300"></canvas>

    <div class="sign-buttons">
      <button class="gray" onclick="clearSignature()">다시 서명</button>
      <button class="green" id="submitBtn" onclick="submitSignature()">전자서명 완료</button>
    </div>
  `;
}

function setupSignatureCanvas() {
  const canvas = document.getElementById("signatureCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let drawing = false;

  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#111827";

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();

    if (e.touches && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * (canvas.width / rect.width),
        y: (e.touches[0].clientY - rect.top) * (canvas.height / rect.height)
      };
    }

    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function start(e) {
    e.preventDefault();
    drawing = true;
    HAS_DRAWN = true;

    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function move(e) {
    if (!drawing) return;
    e.preventDefault();

    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function end(e) {
    e.preventDefault();
    drawing = false;
  }

  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mousemove", move);
  canvas.addEventListener("mouseup", end);
  canvas.addEventListener("mouseleave", end);

  canvas.addEventListener("touchstart", start, { passive: false });
  canvas.addEventListener("touchmove", move, { passive: false });
  canvas.addEventListener("touchend", end, { passive: false });
}

function clearSignature() {
  const canvas = document.getElementById("signatureCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  HAS_DRAWN = false;
}

async function submitSignature() {
  if (!HAS_DRAWN) {
    alert("서명을 먼저 해주세요.");
    return;
  }

  const canvas = document.getElementById("signatureCanvas");
  const signature = canvas.toDataURL("image/png");

  const btn = document.getElementById("submitBtn");
  btn.disabled = true;
  btn.innerText = "전자서명 저장 중...";

  try {
    const result = await postData({
      action: "signContract",
      contractId: CURRENT_CONTRACT_ID,
      publicToken: CURRENT_PUBLIC_TOKEN,
      signature
    });

    if (!result.success) {
      alert(result.message || "전자서명 저장에 실패했습니다.");
      btn.disabled = false;
      btn.innerText = "전자서명 완료";
      return;
    }

    alert("전자서명이 완료되었습니다.");
    location.href =
      `contract-view.html?id=${encodeURIComponent(CURRENT_CONTRACT_ID)}&token=${encodeURIComponent(CURRENT_PUBLIC_TOKEN)}&v=${Date.now()}`;

  } catch (err) {
    alert("오류 발생: " + err.message);
    btn.disabled = false;
    btn.innerText = "전자서명 완료";
  }
}

async function postData(data) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(data)
  });

  return await response.json();
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function won(v) {
  const num = Number(String(v || "").replace(/[^0-9]/g, ""));
  if (!num) return "0원";
  return num.toLocaleString("ko-KR") + "원";
}

function showError(message) {
  document.getElementById("loading").innerHTML = message;
}
function printContract(){

  const ua = navigator.userAgent;

  const isKakao =
    ua.includes("KAKAOTALK");

  const isSamsung =
    ua.includes("SamsungBrowser");

  if(isKakao){

    alert(
      "카카오톡 브라우저에서는 PDF 저장이 제한될 수 있습니다.\n우측 상단 메뉴 → 외부 브라우저 열기 후 다시 시도해 주세요."
    );

    return;
  }

  if(isSamsung){

    setTimeout(()=>{
      window.print();
    },500);

    return;
  }

  window.print();
}