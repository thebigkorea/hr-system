const API_URL =
  "https://script.google.com/macros/s/AKfycbzCO4TLMRGgt_OY-3T92mw58AAKcOwquq0ubepUEJgPO9YPeMV-hNeP7AHy7lvOPog7oQ/exec";

async function createCertificate() {
  const name = value("empName");
  const rrnBack = value("rrnBack").replace(/[^0-9]/g, "");
  const purpose = value("purpose") || "제출용";

  if (!name || !rrnBack) {
    setMessage("이름과 주민번호 뒤 7자리를 입력해주세요.");
    return;
  }

  if (rrnBack.length !== 7) {
    setMessage("주민번호 뒤 7자리는 숫자 7자리로 입력해주세요.");
    return;
  }

  setMessage("직원 정보를 조회하는 중입니다...");

  try {
    const result = await postData({
      action: "findEmployee",
      name: name,
      rrnBack: rrnBack,
      residentBack: rrnBack,
      residentNoBack: rrnBack
    });

    if (!result.success) {
      setMessage(result.message || "일치하는 직원 정보를 찾을 수 없습니다.");
      return;
    }

    const emp = result.employee || {};

    text("certName", emp.name);
    text("certBirth", emp.birth);
    text("certAddress", emp.address);
    text("certStore", emp.store);
    text("certPosition", emp.position || "직원");
    text("certJoinDate", emp.joinDate);
    text("certStatus", emp.status || "재직중");
    text("certPurpose", purpose);
    text("certDate", getTodayKorean());

    document.getElementById("certificateBox").style.display = "block";

    await postData({
      action: "saveIssueLog",
      type: "재직증명서",
      name: emp.name || name,
      purpose: purpose,
      memo: "재직증명서 발급"
    });

    setMessage("");

  } catch (err) {
    console.error(err);
    setMessage("조회 중 오류가 발생했습니다. Apps Script 배포 상태를 확인해주세요.");
  }
}

async function postData(data) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(data)
  });

  return await response.json();
}

function value(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function text(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerText = val || "";
}

function setMessage(msg) {
  const el = document.getElementById("message");
  if (el) el.innerText = msg;
}

function getTodayKorean() {
  const today = new Date();
  return `${today.getFullYear()}년 ${String(today.getMonth() + 1).padStart(2, "0")}월 ${String(today.getDate()).padStart(2, "0")}일`;
}