const API_URL = "https://script.google.com/macros/s/AKfycbzCO4TLMRGgt_OY-3T92mw58AAKcOwquq0ubepUEJgPO9YPeMV-hNeP7AHy7lvOPog7oQ/exec";

async function createCertificate() {
  const name = document.getElementById("name").value.trim();
  const ssnBack = document.getElementById("ssnBack").value.trim();
  const purpose = document.getElementById("purpose").value.trim();
  const message = document.getElementById("message");

  if (!name || !ssnBack || !purpose) {
    message.innerText = "이름, 주민번호 뒤 7자리, 제출 용도를 모두 입력해주세요.";
    return;
  }

  if (ssnBack.length !== 7) {
    message.innerText = "주민번호 뒤 7자리를 정확히 입력해주세요.";
    return;
  }

  message.innerText = "직원 정보를 조회 중입니다...";

  try {
    const findResult = await postData({
      action: "findEmployee",
      name,
      ssnBack
    });

    if (!findResult.success) {
      message.innerText = findResult.message || "직원 정보를 찾을 수 없습니다.";
      return;
    }

    const emp = findResult.employee;

    const logResult = await postData({
      action: "saveIssueLog",
      certType: "재직증명서",
      name: emp.name,
      department: emp.department,
      position: emp.position,
      purpose
    });

    if (!logResult.success) {
      message.innerText = logResult.message || "발급이력 저장 중 오류가 발생했습니다.";
      return;
    }

    fillCertificate(emp, purpose, logResult.issueNo);
    message.innerText = "재직증명서가 생성되었습니다. 아래 인쇄하기 버튼을 눌러 출력하세요.";

  } catch (err) {
    message.innerText = "오류가 발생했습니다: " + err.message;
  }
}

async function postData(data) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(data)
  });

  return await response.json();
}

function fillCertificate(emp, purpose, issueNo) {
  document.getElementById("issueNo").innerText = issueNo;
  document.getElementById("certName").innerText = emp.name;
  document.getElementById("certSsn").innerText = `${emp.ssnFront}-${String(emp.ssnBack).substring(0, 1)}******`;
  document.getElementById("certAddress").innerText = emp.address;
  document.getElementById("certDepartment").innerText = emp.department;
  document.getElementById("certPosition").innerText = emp.position;
  document.getElementById("certPeriod").innerText = `${emp.joinDate} ~ 현재`;
  document.getElementById("certPurpose").innerText = purpose;
  document.getElementById("certToday").innerText = getTodayKorean();
}

function getTodayKorean() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}년 ${m}월 ${d}일`;
}