const API_URL =
  "https://script.google.com/macros/s/AKfycbzCO4TLMRGgt_OY-3T92mw58AAKcOwquq0ubepUEJgPO9YPeMV-hNeP7AHy7lvOPog7oQ/exec";

const searchBtn = document.getElementById("searchBtn");
const message = document.getElementById("message");

searchBtn.addEventListener("click", searchCertificate);

async function searchCertificate() {
  const name = document.getElementById("name").value.trim();
  const ssn = document.getElementById("ssn").value.trim();
  const purpose = document.getElementById("purpose").value.trim();

  if (!name || !ssn) {
    message.innerText = "이름과 주민번호 뒤 7자리를 입력해주세요.";
    return;
  }

  setLoading(true);
  message.innerText = "조회중입니다...";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "getCertificate",
        name: name,
        ssn: ssn
      })
    });

    const result = await response.json();

    if (!result.success) {
      message.innerText =
        result.message || "직원 정보를 찾을 수 없습니다.";
      setLoading(false);
      return;
    }

    renderCertificate(result.data, purpose);

  } catch (err) {
    console.error(err);
    message.innerText = "조회 중 오류가 발생했습니다.";
    setLoading(false);
  }
}

function setLoading(isLoading) {
  if (!searchBtn) return;

  if (isLoading) {
    searchBtn.disabled = true;
    searchBtn.innerText = "조회 중...";
    searchBtn.style.opacity = "0.7";
    searchBtn.style.transform = "scale(0.98)";
  } else {
    searchBtn.disabled = false;
    searchBtn.innerText = "재직증명서 조회 및 생성";
    searchBtn.style.opacity = "1";
    searchBtn.style.transform = "scale(1)";
  }
}

function renderCertificate(emp, purpose) {
  document.body.innerHTML = `
    <div class="wrap result-wrap">
      <div class="certificate-paper">

        <div class="issue-no">
          발급번호 : ${makeIssueNo("EMP")}
        </div>

        <div class="paper-title">
          재 직 증 명 서
        </div>

        <table class="info-table">
          <tr>
            <th>성 명</th>
            <td>${emp.name || ""}</td>
          </tr>

          <tr>
            <th>소 속</th>
            <td>${emp.department || ""}</td>
          </tr>

          <tr>
            <th>직 위</th>
            <td>${emp.position || ""}</td>
          </tr>

          <tr>
            <th>입 사 일</th>
            <td>${emp.joinDate || ""}</td>
          </tr>

          <tr>
            <th>재직상태</th>
            <td>${emp.status || "재직중"}</td>
          </tr>

          <tr>
            <th>제출용도</th>
            <td>${purpose || "-"}</td>
          </tr>
        </table>

        <div class="confirm-text">
          위 사람은 상기와 같이 당사에 재직 중임을 증명합니다.
        </div>

        <div class="date-text">
          ${todayKorean()}
        </div>

        <div class="company-info">
          <p>서울특별시 송파구 올림픽로 300 롯데월드몰 5층</p>
          <p>한국의집 롯데월드몰점</p>

          <p class="representative-line">
            <span>대표이사 박병호</span>
            <img src="stamp.png" class="small-stamp" alt="법인인감">
          </p>
        </div>

      </div>

      <div class="print-btn-area no-print">
        <button class="print-btn" type="button" onclick="window.print()">
          인쇄 / PDF 저장
        </button>
      </div>
    </div>
  `;
}

function todayKorean() {
  const d = new Date();

  return `${d.getFullYear()}년 ${String(d.getMonth() + 1).padStart(2, "0")}월 ${String(d.getDate()).padStart(2, "0")}일`;
}

function makeIssueNo(prefix) {
  const d = new Date();

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");

  return `${prefix}-${y}${m}${day}-${h}${min}${s}`;
}