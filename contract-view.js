const API_URL =
  "https://script.google.com/macros/s/AKfycbzCO4TLMRGgt_OY-3T92mw58AAKcOwquq0ubepUEJgPO9YPeMV-hNeP7AHy7lvOPog7oQ/exec";

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const contractId = params.get("id");

  if (!contractId) {
    setStatus("계약번호가 없습니다.");
    return;
  }

  await loadContractView(contractId);
});

async function loadContractView(contractId) {
  setStatus("계약서를 불러오는 중입니다...");

  try {
    const result = await postData({
      action: "getContractById",
      contractId
    });

    if (!result.success) {
      setStatus(result.message || "계약서를 불러오지 못했습니다.");
      return;
    }

    fillContract(result.contract);

    if (result.signature) {
      const img = document.getElementById("workerSignatureImage");
      img.src = result.signature;
      img.style.display = "block";
    }

    document.getElementById("signedTime").innerText =
      result.signedAt ? result.signedAt + " 전자서명 완료" : "";

    if (result.status === "서명완료") {
      setStatus("전자서명이 완료된 근로계약서입니다.");
    } else {
      setStatus("아직 전자서명이 완료되지 않은 계약서입니다.");
    }

  } catch (err) {
    setStatus("계약서 조회 중 오류가 발생했습니다.");
  }
}

function fillContract(data) {
  text("cEmpName", data.empName);
  text("cWorkerName", data.empName);
  text("cResidentNo", data.residentNo);
  text("cBirth", data.birth);
  text("cPhone", data.phone);
  text("cAddress", data.address);
  text("cBankAccount", `${data.bank || ""} ${data.account || ""}`);

  text("cJoinDate", data.joinDate);
  text("cWorkPlace", data.workPlace);
  text("cJobDuty", data.jobDuty);
  text("cWorkDays", data.workDays);
  text("cWorkTime", data.workTime);
  text("cBreakTime", data.breakTime);
  text("cMonthHour", data.monthHour);

  text("cBasePay", withWon(data.basePay));
  text("cOvertimePay", withWon(data.overtimePay));
  text("cDutyPay", withWon(data.dutyPay));
  text("cPositionPay", withWon(data.positionPay));
  text("cMealPay", withWon(data.mealPay));
  text("cTotalPay", withWon(data.totalPay));

  text("cToday", getTodayKorean());
}

async function postData(data) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(data)
  });

  return await response.json();
}

function text(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerText = val || "";
}

function setStatus(msg) {
  const el = document.getElementById("statusBox");
  if (el) el.innerText = msg;
}

function withWon(v) {
  if (!v) return "0원";
  return `${v}원`;
}

function getTodayKorean() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}년 ${m}월 ${d}일`;
}