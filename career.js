const API_URL =
  "https://script.google.com/macros/s/AKfycbzCO4TLMRGgt_OY-3T92mw58AAKcOwquq0ubepUEJgPO9YPeMV-hNeP7AHy7lvOPog7oQ/exec";

const message = document.getElementById("message");
const searchBtn = document.getElementById("searchBtn");

async function createCareerCertificate() {
  try {
    setLoading(true);

    const name = document.getElementById("name").value.trim();
    const ssnBack = document.getElementById("ssnBack").value.trim();
    const work = document.getElementById("work").value.trim();
    const purpose = document.getElementById("purpose").value.trim();

    if (!name || !ssnBack) {
      message.innerText = "직원 이름과 주민번호 뒤 7자리를 입력해주세요.";
      setLoading(false);
      return;
    }

    message.innerText = "조회중입니다...";

    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "getCareerCertificate",
        name: name,
        ssn: ssnBack
      })
    });

    const result = await response.json();

    if (!result.success) {
      message.innerText =
        result.message || "직원 정보를 찾을 수 없습니다.";
      setLoading(false);
      return;
    }

    renderCareer(result.data, work, purpose);

    message.innerText = "경력증명서가 생성되었습니다.";

  } catch (err) {
    console.error(err);
    message.innerText = "조회 중 오류가 발생했습니다.";
  } finally {
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
    searchBtn.innerText = "경력증명서 조회 및 생성";
    searchBtn.style.opacity = "1";
    searchBtn.style.transform = "scale(1)";
  }
}

function renderCareer(emp, work, purpose) {
  document.getElementById("issueNo").innerText =
    emp.issueNo || "-";

  document.getElementById("certName").innerText =
    emp.name || "";

  document.getElementById("certSsn").innerText =
    emp.ssn || maskSsn(emp.ssnBack || "");

  document.getElementById("certAddress").innerText =
    emp.address || "";

  document.getElementById("certDepartment").innerText =
    emp.department || "";

  document.getElementById("certPosition").innerText =
    emp.position || "";

  document.getElementById("certPeriod").innerText =
    `${emp.joinDate || ""} ~ ${emp.leaveDate || "재직중"}`;

  document.getElementById("certWork").innerText =
    work || emp.jobType || "";

  document.getElementById("certPurpose").innerText =
    purpose || "";

  document.getElementById("certToday").innerText =
    todayKorean();

  document.getElementById("previewBox").scrollIntoView({
    behavior: "smooth"
  });
}

function maskSsn(ssnBack) {
  if (!ssnBack) return "*******";
  return ssnBack.substring(0, 1) + "******";
}

function todayKorean() {
  const d = new Date();

  return `${d.getFullYear()}년 ${String(d.getMonth() + 1).padStart(2, "0")}월 ${String(d.getDate()).padStart(2, "0")}일`;
}