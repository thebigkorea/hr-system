const API_URL = "https://script.google.com/macros/s/AKfycbzCO4TLMRGgt_OY-3T92mw58AAKcOwquq0ubepUEJgPO9YPeMV-hNeP7AHy7lvOPog7oQ/exec";

async function createEmployeeCard() {
  const name = document.getElementById("name").value.trim();
  const ssnBack = document.getElementById("ssnBack").value.trim();
  const message = document.getElementById("message");

  if (!name || !ssnBack) {
    message.innerText = "이름과 주민번호 뒤 7자리를 입력해주세요.";
    return;
  }

  if (ssnBack.length !== 7) {
    message.innerText = "주민번호 뒤 7자리를 정확히 입력해주세요.";
    return;
  }

  message.innerText = "직원 정보를 조회 중입니다...";

  try {
    const result = await postData({
      action:"findEmployee",
      name,
      ssnBack
    });

    if (!result.success) {
      message.innerText = result.message || "직원 정보를 찾을 수 없습니다.";
      return;
    }

    fillEmployeeCard(result.employee);
    message.innerText = "인사기록카드가 생성되었습니다. 아래 인쇄하기 버튼을 눌러 출력하세요.";

  } catch (err) {
    message.innerText = "오류가 발생했습니다: " + err.message;
  }
}

async function postData(data) {
  const response = await fetch(API_URL, {
    method:"POST",
    body:JSON.stringify(data)
  });

  return await response.json();
}

function fillEmployeeCard(emp) {
  setText("employeeNo", emp.employeeNo);
  setText("empName", emp.name);
  setText("empSsn", `${emp.ssnFront}-${String(emp.ssnBack).substring(0,1)}******`);
  setText("empBirth", emp.birth);
  setText("empGender", emp.gender);
  setText("empStatus", emp.status);

  setText("empDepartment", emp.department);
  setText("empPosition", emp.position);
  setText("empJoinDate", emp.joinDate);
  setText("empLeaveDate", emp.leaveDate || "-");
  setText("empPayType", emp.payType);
  setText("empBasePay", emp.basePay);

  setText("empPhone", emp.phone);
  setText("empEmail", emp.email);
  setText("empAddress", emp.address);

  setText("empBank", emp.bank);
  setText("empAccount", emp.account);
  setText("empAccountHolder", emp.accountHolder);

  setText("empEmergencyName", emp.emergencyName);
  setText("empEmergencyRelation", emp.emergencyRelation);
  setText("empEmergencyPhone", emp.emergencyPhone);

  setText("empEducation", emp.education);
  setText("empMajor", emp.major);
  setText("empCareer", emp.career);
  setText("empLicense", emp.license);

  setText("empHiringPath", emp.hiringPath);
  setText("empHrMemo", emp.hrMemo || emp.memo);

  setText("today", getTodayKorean());
}

function setText(id, value) {
  document.getElementById(id).innerText = value || "";
}

function getTodayKorean() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}년 ${m}월 ${d}일`;
}