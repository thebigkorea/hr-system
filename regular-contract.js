const API_URL =
  "https://script.google.com/macros/s/AKfycbzCO4TLMRGgt_OY-3T92mw58AAKcOwquq0ubepUEJgPO9YPeMV-hNeP7AHy7lvOPog7oQ/exec";

async function createRegularContract() {
  const name = document.getElementById("name").value.trim();
  const ssnBack = document.getElementById("ssnBack").value.trim();
  const jobDuty = document.getElementById("jobDuty").value.trim();
  const workTime = document.getElementById("workTime").value.trim();
  const breakTime = document.getElementById("breakTime").value.trim();
  const monthlyPay = document.getElementById("monthlyPay").value.trim();
  const message = document.getElementById("message");

  if (!name || !ssnBack || !jobDuty || !workTime || !breakTime || !monthlyPay) {
    message.innerText = "모든 항목을 입력해주세요.";
    return;
  }

  if (ssnBack.length !== 7) {
    message.innerText = "주민번호 뒤 7자리를 정확히 입력해주세요.";
    return;
  }

  message.innerText = "직원 정보를 조회 중입니다...";

  try {
    const result = await postData({
      action: "findEmployee",
      name,
      ssnBack
    });

    if (!result.success) {
      message.innerText = result.message || "직원 정보를 찾을 수 없습니다.";
      return;
    }

    fillContract(result.employee, {
      jobDuty,
      workTime,
      breakTime,
      monthlyPay
    });

    message.innerText = "정규직 근로계약서가 생성되었습니다. 아래 인쇄하기 버튼을 눌러 출력하세요.";

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

function fillContract(emp, input) {
  document.getElementById("contractName").innerText = emp.name;
  document.getElementById("workerName").innerText = emp.name;
  document.getElementById("joinDate").innerText = emp.joinDate || "";
  document.getElementById("department").innerText = emp.department || "한국의집 롯데월드몰점";
  document.getElementById("jobDutyText").innerText = input.jobDuty;
  document.getElementById("workTimeText").innerText = input.workTime;
  document.getElementById("breakTimeText").innerText = input.breakTime;
  document.getElementById("monthlyPayText").innerText = `${input.monthlyPay}원`;
  document.getElementById("birth").innerText = emp.birth || "";
  document.getElementById("address").innerText = emp.address || "";
  document.getElementById("phone").innerText = emp.phone || "";
  document.getElementById("todayText").innerText = getTodayKorean();
}

function getTodayKorean() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}년 ${m}월 ${d}일`;
}