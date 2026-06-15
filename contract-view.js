const API_URL =
  "https://script.google.com/macros/s/AKfycbzCO4TLMRGgt_OY-3T92mw58AAKcOwquq0ubepUEJgPO9YPeMV-hNeP7AHy7lvOPog7oQ/exec";

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const contractId = params.get("id");

  if (!contractId) {
    showError("계약번호가 없습니다.");
    return;
  }

  await loadContract(contractId);
});

async function loadContract(contractId) {
  try {
    const result = await postData({
      action: "getContractById",
      contractId
    });

    if (!result.success) {
      showError(result.message || "계약서를 불러오지 못했습니다.");
      return;
    }

    renderContract(result);

    document.getElementById("loading").style.display = "none";
    document.getElementById("contractWrap").style.display = "block";

  } catch (err) {
    showError("계약서 조회 중 오류가 발생했습니다.");
  }
}

function renderContract(result) {
  const c = result.contract || {};
  const signature = result.signature || "";
  const contractType = c.contractType || result.contractType || "";

  const isPart =
    contractType.includes("계약직") ||
    contractType.includes("아르바이트");

  const isService =
    contractType.includes("용역") ||
    contractType.includes("사업소득");

  if (isService) {
    document.title = "사업소득자 용역계약서 완료본";
    document.getElementById("viewTitle").innerText = "사업소득자 용역계약서";
  } else if (isPart) {
    document.title = "계약직(아르바이트) 근로계약서 완료본";
    document.getElementById("viewTitle").innerText = "계약직(아르바이트) 근로계약서";
  } else {
    document.title = "정규직 근로계약서 완료본";
    document.getElementById("viewTitle").innerText = "근 로 계 약 서";
  }

  if (isService) {
    document.getElementById("contractContent").innerHTML =
      renderServiceContract(c, signature, result);
  } else if (isPart) {
    document.getElementById("contractContent").innerHTML =
      renderPartContract(c, signature, result);
  } else {
    document.getElementById("contractContent").innerHTML =
      renderRegularContract(c, signature, result);
  }
}

function renderRegularContract(c, signature, result) {
  return `
    <p>
      한국의집 롯데월드몰점(이하 “회사”라 한다)과 근로자
      <strong>${c.empName || ""}</strong>
      (이하 “직원”이라 한다)은 다음과 같이 근로계약을 체결하고 이를 성실히 이행할 것을 약정한다.
    </p>

    <div class="section-title">제1조 계약기간</div>
    <p>입사일 : ${c.joinDate || ""}</p>
    <p>입사일로부터 기간의 정함이 없는 근로계약을 체결한다. 수습기간은 3개월로 한다.</p>

    <div class="section-title">제2조 근무장소 및 업무내용</div>
    <p>① 근무장소 : ${c.workPlace || "한국의집 롯데월드몰점"}</p>
    <p>② 업무내용 : ${c.jobDuty || ""}</p>

    <div class="section-title">제3조 근로시간 및 휴게</div>
    <p>① 근무시간 및 휴게시간은 아래와 같다. (${c.workDays || ""} 근무)</p>

    <table class="contract-table">
      <tr>
        <th>월 기준시간</th>
        <th>근무시간</th>
        <th>휴게시간</th>
      </tr>
      <tr>
        <td>${c.monthHour || ""}</td>
        <td>${c.workTime || `${c.startTime || ""} ~ ${c.endTime || ""}`}</td>
        <td>${c.breakTime || ""}</td>
      </tr>
    </table>

    <div class="section-title">제4조 휴일 및 휴가</div>
    <p>① 법정유급휴일은 주휴일 및 근로자의 날로 한다.</p>
    <p>② 근로기준법이 정하는 바에 따라 연차휴가를 부여한다.</p>

    <div class="section-title">제5조 임금</div>
    <p>① 임금은 월 기준시간에 해당하는 기본급 및 각 수당으로 구성된다.</p>

    <table class="contract-table">
      <tr>
        <th>항목</th>
        <th>금액</th>
        <th>산정 기준</th>
      </tr>
      <tr>
        <td>기본급</td>
        <td>${won(c.basePay)}</td>
        <td>월 기준시간 분의 임금</td>
      </tr>
      <tr>
        <td>연장수당</td>
        <td>${won(c.overtimePay)}</td>
        <td>연장근로 해당분</td>
      </tr>
      <tr>
        <td>직무수당</td>
        <td>${won(c.dutyPay)}</td>
        <td>직무 수행 수당</td>
      </tr>
      <tr>
        <td>직책수당</td>
        <td>${won(c.positionPay)}</td>
        <td>직책 수행 수당</td>
      </tr>
      <tr>
        <td>식대</td>
        <td>${won(c.mealPay)}</td>
        <td>식대 보조</td>
      </tr>
      <tr class="total-row">
        <td>월급총액</td>
        <td>${won(c.totalPay)}</td>
        <td>상기 금액의 합계</td>
      </tr>
    </table>

    <p>② 회사는 매월 1일부터 말일까지의 기간 동안 산정한 월 급여를 익월 10일에 직원 명의의 은행계좌로 송금한다.</p>
    <p>③ 급여 지급 시 갑근세, 사회보험료 등 법정 공제액은 공제 후 지급한다.</p>
    <p>④ 급여계좌 : ${c.bank || ""} ${c.account || ""}</p>

    <div class="section-title">제6조 제출서류</div>
    <p>직원은 채용과 동시에 주민등록등본, 보건증, 통장사본, 신분증사본 등 회사가 요청하는 서류를 제출한다.</p>

    <div class="section-title">제7조 퇴직급여</div>
    <p>회사는 근로자퇴직급여보장법이 정한 바에 따라 퇴직급여를 지급한다.</p>

    <div class="section-title">제8조 퇴직절차</div>
    <p>직원은 퇴직하고자 할 경우 사직원을 사전 제출하여야 한다.</p>

    <div class="section-title">제9조 신의성실의무</div>
    <p>직원은 회사의 경영방침에 따라 신의와 성실로 근무하여야 하며, 회사의 영업기밀사항을 외부에 누설하여서는 아니 된다.</p>

    <div class="section-title">제10조 CCTV 설치 동의</div>
    <p>직원은 방범, 화재예방, 시설안전관리 목적의 CCTV 설치 및 운영에 대해 충분히 설명을 듣고 이해 및 동의한다.</p>

    <div class="section-title">제11조 전자계약 및 계약서 교부 확인</div>
    <p>회사와 직원은 본 계약이 전자문서 및 전자서명 방식으로 체결될 수 있음을 확인하며, 전자서명은 자필서명 또는 날인과 동일한 효력을 가진다.</p>

    <div class="section-title">제12조 기타사항</div>
    <p>본 계약서에 명시되지 않은 사항은 근로기준법, 관계 법령, 취업규칙 및 판례가 정하는 바에 따른다.</p>

    ${signBox(c, signature, result, "회사", "근로자", "급여계좌")}
  `;
}

function renderPartContract(c, signature, result) {
  return `
    <p>
      한국의집 롯데월드몰점(이하 “사업주”라 함)과 근로자
      <strong>${c.empName || ""}</strong>
      (이하 “근로자”라 함)은 다음과 같이 근로계약을 체결한다.
    </p>

    <div class="section-title">1. 근로계약기간</div>
    <p>${c.startDate || ""}부터 ${c.endDate || ""}까지</p>

    <div class="section-title">2. 근무장소</div>
    <p>${c.workPlace || "한국의집 롯데월드몰점"}</p>

    <div class="section-title">3. 업무내용</div>
    <p>${c.jobDuty || ""}</p>

    <div class="section-title">4. 근로시간</div>
    <table class="contract-table">
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

    <div class="section-title">5. 근무일 / 휴일</div>
    <p>${c.workDays || ""} 근무 / 주휴일 : ${c.holiday || "선택 안함"}</p>

    <div class="section-title">6. 임금</div>
    <table class="contract-table">
      <tr>
        <th>구분</th>
        <th>내용</th>
      </tr>
      <tr>
        <td>시급</td>
        <td>${won(c.hourPay || c.totalPay)}</td>
      </tr>
      <tr>
        <td>4대보험</td>
        <td>${c.insurance || ""}</td>
      </tr>
    </table>

    <p>회사는 매월 1일부터 말일까지의 기간 동안 산정한 급여를 익월 10일에 근로자 명의의 은행계좌로 송금한다.</p>
    <p>급여 지급 시 갑근세, 사회보험료 등 법정공제액은 공제 후 지급한다.</p>
    <p>급여계좌 : ${c.bank || ""} ${c.account || ""}</p>

    <div class="section-title">7. 4대보험 가입유무</div>
    <p>근로자는 4대보험 가입 여부에 대하여 <strong>${c.insurance || ""}</strong> 의사를 표시한다.</p>

    <div class="section-title">8. 근로계약서 교부</div>
    <p>근로자는 본 근로계약서를 전자문서 방식으로 교부받았음을 확인한다.</p>

    <div class="section-title">9. CCTV 설치 동의</div>
    <p>근로자는 방범, 화재예방, 시설안전관리 목적의 CCTV 설치 및 운영에 대해 충분히 설명을 듣고 동의한다.</p>

    <div class="section-title">10. 전자계약 및 전자서명</div>
    <p>사업주와 근로자는 본 계약이 전자문서 및 전자서명 방식으로 체결될 수 있음을 확인하며, 전자서명은 자필서명 또는 날인과 동일한 효력을 가진다.</p>

    ${signBox(c, signature, result, "사업주", "근로자", "급여계좌")}
  `;
}

function renderServiceContract(c, signature, result) {
  return `
    <p>
      한국의집 롯데월드몰점(이하 “위탁자”라 함)과
      <strong>${c.empName || ""}</strong>
      (이하 “수탁자”라 함)은 다음과 같이 용역계약을 체결한다.
    </p>

    <div class="section-title">제1조 계약기간</div>
    <p>${c.startDate || ""}부터 ${c.endDate || ""}까지로 한다.</p>

    <div class="section-title">제2조 용역 장소 및 내용</div>
    <p>① 용역장소 : ${c.workPlace || "한국의집 롯데월드몰점"}</p>
    <p>② 용역내용 : ${c.jobDuty || ""}</p>

    <div class="section-title">제3조 용역비</div>
    <table class="contract-table">
      <tr>
        <th>지급 기준</th>
        <th>용역비</th>
        <th>원천징수</th>
      </tr>
      <tr>
        <td>${c.payType || ""}</td>
        <td>${won(c.servicePay || c.totalPay)}</td>
        <td>${c.taxType || ""}</td>
      </tr>
    </table>

    <p>
      위탁자는 수탁자에게 용역 수행 대가로 위 금액을 지급하며,
      사업소득세 등 관련 법령에 따른 원천징수 대상 금액은 공제 후 지급한다.
    </p>

    <p>지급계좌 : ${c.bank || ""} ${c.account || ""}</p>

    <div class="section-title">제4조 독립사업자 지위</div>
    <p>
      수탁자는 독립된 사업소득자로서 본 용역을 수행하며,
      본 계약은 근로기준법상 근로계약이 아님을 상호 확인한다.
    </p>

    <div class="section-title">제5조 지휘·감독의 제한</div>
    <p>
      위탁자는 용역의 목적과 결과에 필요한 범위에서 업무 내용을 협의할 수 있으나,
      수탁자의 구체적인 업무수행 방법과 시간 배분에 대해 근로자와 같은 직접적 지휘·감독을 하지 않는다.
    </p>

    <div class="section-title">제6조 세금 및 4대보험</div>
    <p>
      수탁자는 사업소득자로서 본인의 세무상 책임을 부담하며,
      본 계약에 따라 발생하는 소득은 사업소득으로 처리한다.
      4대보험 적용 여부는 관계 법령에 따른다.
    </p>

    <div class="section-title">제7조 비밀유지</div>
    <p>
      수탁자는 용역 수행 과정에서 알게 된 위탁자의 영업정보, 고객정보, 운영정보를 외부에 누설하여서는 아니 된다.
    </p>

    <div class="section-title">제8조 계약 해지</div>
    <p>
      당사자 일방이 본 계약을 위반하거나 용역 수행이 현저히 곤란한 경우,
      상대방은 계약을 해지할 수 있다.
    </p>

    <div class="section-title">제9조 전자계약 및 전자서명</div>
    <p>
      위탁자와 수탁자는 본 계약이 전자문서 및 전자서명 방식으로 체결될 수 있음을 확인하며,
      전자서명은 자필서명 또는 날인과 동일한 효력을 가진다.
    </p>

    ${signBox(c, signature, result, "위탁자", "수탁자", "지급계좌")}
  `;
}

function signBox(c, signature, result, companyLabel, workerLabel, accountLabel) {
  return `
    <p style="text-align:center;font-weight:900;margin-top:50px;">
      당사자는 상기 계약의 내용을 명확히 숙지하고 계약 체결하였음을 확인한다.
    </p>

    <p style="text-align:center;font-weight:900;font-size:24px;">
      ${todayKorean()}
    </p>

    <div class="sign-area">
      <div class="sign-box">
        <h3>[${companyLabel}]</h3>
        <p>상호 : 한국의집 롯데월드몰점</p>
        <p>대표자 : 박병호</p>
        <p>주소 : 서울시 송파구 올림픽로 300, 5층</p>
        <p>연락처 : 042-712-5035</p>
        <img class="company-seal"
             src="https://thebigkorea.github.io/hr-system/stamp.png"
             style="width:90px;height:auto;display:block;margin-top:12px;">
      </div>

      <div class="sign-box">
        <h3>[${workerLabel}]</h3>
        <p>성명 : ${c.empName || ""}</p>
        <p>주민등록번호 : ${c.residentNo || ""}</p>
        <p>생년월일 : ${formatDateOnly(c.birth)}</p>
        <p>주소 : ${c.address || ""}</p>
        <p>연락처 : ${c.phone || ""}</p>
        <p>${accountLabel || "급여계좌"} : ${c.bank || ""} ${c.account || ""}</p>

        <p class="sign-label">전자서명</p>
        ${
          signature
            ? `<img class="signature-img" src="${signature}" style="width:220px;height:auto;border-bottom:1px solid #111;">`
            : `<p>서명 정보 없음</p>`
        }
        <p>${result.signedAt || ""} 전자서명 완료</p>
      </div>
    </div>

    <div class="bottom-buttons">
      <button class="btn btn-print" onclick="printContract()">PDF 저장 / 인쇄</button>
    </div>
  `;
}

function showError(msg) {
  document.getElementById("loading").innerText = msg;
}

async function postData(data) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(data)
  });

  return await response.json();
}

function won(v) {

  if(v === null || v === undefined || v === ""){
    return "0원";
  }

  const num =
    Number(
      String(v)
        .replace(/,/g,"")
        .replace(/원/g,"")
    );

  if(isNaN(num)){
    return v;
  }

  return num.toLocaleString("ko-KR") + "원";
}

function todayKorean() {
  const today = new Date();
  return `${today.getFullYear()}년 ${String(today.getMonth() + 1).padStart(2, "0")}월 ${String(today.getDate()).padStart(2, "0")}일`;
}
function printContract(){

  const html =
    document.getElementById("contractWrap").outerHTML;

  const printWindow =
    window.open("", "_blank");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>전자근로계약서 인쇄</title>

      <style>
        body{
          margin:0;
          background:#fff;
          font-family:'Pretendard','Noto Sans KR',sans-serif;
          color:#222;
        }

        .contract-wrap{
          width:100%;
          max-width:none;
          margin:0;
          box-shadow:none;
          border-radius:0;
          overflow:visible;
        }

        .top-area{
          background:#1f3f75;
          color:#fff;
          padding:40px 30px;
          text-align:center;
        }

        .top-area h1{
          margin:0;
          font-size:42px;
          letter-spacing:8px;
          font-weight:900;
        }

        .content{
          padding:18mm;
          line-height:1.7;
          font-size:16px;
        }

        .section-title{
          font-size:22px;
          font-weight:900;
          margin-top:35px;
          margin-bottom:14px;
          color:#1f3f75;
          border-left:6px solid #1f3f75;
          padding-left:12px;
        }

        .contract-table{
          width:100%;
          border-collapse:collapse;
          margin:14px 0 24px;
        }

        .contract-table th,
        .contract-table td{
          border:1px solid #999;
          padding:9px;
          font-size:14px;
          text-align:center;
        }

        .contract-table th{
          background:#1f3f75;
          color:#fff;
        }

        .sign-area{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:24px;
          margin-top:40px;
        }

        .sign-box{
          border:1px solid #999;
          border-radius:12px;
          padding:18px;
          min-height:260px;
        }

        .sign-box h3{
          margin-top:0;
          color:#1f3f75;
        }

        .company-seal{
          width:90px;
        }

        .signature-img{
          width:180px;
          border-bottom:1px solid #111;
        }

        .bottom-buttons{
          display:none !important;
        }

        @page{
          size:A4;
          margin:10mm;
        }
      </style>
    </head>

    <body>
      ${html}

      <script>
        window.onload = function(){
          window.print();
        };
      <\/script>
    </body>
    </html>
  `);

  printWindow.document.close();
}
function formatDateOnly(value){

  if(!value) return "";

  const d = new Date(value);

  if(!isNaN(d.getTime())){
    return d.toLocaleDateString("ko-KR", {
      year:"numeric",
      month:"2-digit",
      day:"2-digit"
    });
  }

  return value;
}