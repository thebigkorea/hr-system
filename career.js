/* =========================
   career-certificate.js
   경력증명서 최종 전체본
   ========================= */

const API_URL =
"https://script.google.com/macros/s/AKfycbzCO4TLMRGgt_OY-3T92mw58AAKcOwquq0ubepUEJgPO9YPeMV-hNeP7AHy7lvOPog7oQ/exec";

const searchBtn =
document.getElementById("searchBtn");

const message =
document.getElementById("message");

searchBtn.addEventListener(
  "click",
  searchCareer
);

async function searchCareer() {

  const name =
    document.getElementById("name")
    .value.trim();

  const ssn =
    document.getElementById("ssn")
    .value.trim();

  const purpose =
    document.getElementById("purpose")
    .value.trim();

  if (!name || !ssn) {

    message.innerText =
      "이름과 주민번호 뒤 7자리를 입력해주세요.";

    return;
  }

  message.innerText = "조회중입니다...";

  try {

    const response =
      await fetch(API_URL, {

        method: "POST",

        body: JSON.stringify({
          action: "getCareerCertificate",
          name,
          ssn
        })
      });

    const result =
      await response.json();

    console.log(result);

    if (!result.success) {

      message.innerText =
        result.message ||
        "직원을 찾을 수 없습니다.";

      return;
    }

    renderCareer(
      result.data,
      purpose
    );

  } catch (err) {

    console.error(err);

    message.innerText =
      "조회 중 오류가 발생했습니다.";
  }
}

function renderCareer(emp, purpose) {

  document.body.innerHTML = `

  <div class="wrap">

    <div class="certificate-paper">

      <div class="paper-title">
        경력증명서
      </div>

      <table class="info-table">

        <tr>
          <th>성명</th>
          <td>${emp.name || ""}</td>
        </tr>

        <tr>
          <th>소속</th>
          <td>${emp.department || ""}</td>
        </tr>

        <tr>
          <th>직위</th>
          <td>${emp.position || ""}</td>
        </tr>

        <tr>
          <th>근무기간</th>
          <td>
            ${emp.joinDate || ""}
            ~
            ${emp.leaveDate || "현재"}
          </td>
        </tr>

        <tr>
          <th>담당업무</th>
          <td>${emp.jobType || ""}</td>
        </tr>

        <tr>
          <th>제출용도</th>
          <td>${purpose || "-"}</td>
        </tr>

      </table>

      <div class="confirm-text">
        위 사람은 상기와 같이
        근무하였음을 증명합니다.
      </div>

      <div class="date-text">
        ${todayKorean()}
      </div>

      <div class="company-info">

        <p>한국의집 롯데월드몰점</p>

        <p class="representative-line">
          <span>대표자 : 박병호</span>

          <img
            src="stamp.png"
            class="small-stamp"
            alt="직인"
          >
        </p>

        <p>
          주소 : 서울시 송파구
          올림픽로 300, 5층
        </p>

      </div>

      <button
        class="print-btn"
        onclick="window.print()">

        인쇄 / PDF 저장

      </button>

    </div>

  </div>

  `;
}

function todayKorean() {

  const d = new Date();

  return `
  ${d.getFullYear()}년
  ${String(d.getMonth()+1)
    .padStart(2,"0")}월
  ${String(d.getDate())
    .padStart(2,"0")}일
  `;
}