const API_URL =
  "https://script.google.com/macros/s/AKfycbzCO4TLMRGgt_OY-3T92mw58AAKcOwquq0ubepUEJgPO9YPeMV-hNeP7AHy7lvOPog7oQ/exec";

document.addEventListener("DOMContentLoaded", () => {
  applyMoneyComma();
});

function createContract() {
  const data = {
    empName: getValue("empName"),
    residentNo: getValue("residentNo"),
    birth: getValue("birth"),
    phone: getValue("phone"),
    address: getValue("address"),
    bank: getValue("bank"),
    account: getValue("account"),

    joinDate: getValue("joinDate"),
    workDays: getValue("workDays"),
    monthHour: getValue("monthHour") || "209",
    workTime: getValue("workTime"),
    breakTime: getValue("breakTime"),
    workPlace: getValue("workPlace"),
    jobDuty: getValue("jobDuty"),

    basePay: getValue("basePay"),
    overtimePay: getValue("overtimePay"),
    dutyPay: getValue("dutyPay"),
    positionPay: getValue("positionPay"),
    mealPay: getValue("mealPay"),
    totalPay: getValue("totalPay")
  };

  const required = [
    "empName",
    "residentNo",
    "birth",
    "phone",
    "address",
    "joinDate",
    "workDays",
    "workTime",
    "breakTime",
    "workPlace",
    "jobDuty",
    "basePay",
    "totalPay"
  ];

  for (const key of required) {
    if (!data[key]) {
      setMessage("필수 항목을 모두 입력해주세요.");
      return;
    }
  }

  fillContract(data);
  saveEmployeeFromContract(data);

  setMessage("정규직 근로계약서가 생성되었고, 인사관리대장에 저장 요청되었습니다.");
}

function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value || "";
}

function setMessage(msg) {
  const el = document.getElementById("message");
  if (el) el.innerText = msg;
}

function money(value) {
  if (!value) return "0원";
  return `${value}원`;
}

function fillContract(data) {
  setText("cEmpName", data.empName);
  setText("cWorkerName", data.empName);
  setText("cResidentNo", data.residentNo);
  setText("cBirth", data.birth);
  setText("cPhone", data.phone);
  setText("cAddress", data.address);
  setText("cBankAccount", `${data.bank} ${data.account}`);

  setText("cJoinDate", data.joinDate);
  setText("cWorkDays", data.workDays);
  setText("cMonthHour", data.monthHour);
  setText("cWorkTime", data.workTime);
  setText("cBreakTime", data.breakTime);
  setText("cWorkPlace", data.workPlace);
  setText("cJobDuty", data.jobDuty);

  setText("cBasePay", money(data.basePay));
  setText("cOvertimePay", money(data.overtimePay));
  setText("cDutyPay", money(data.dutyPay));
  setText("cPositionPay", money(data.positionPay));
  setText("cMealPay", money(data.mealPay));
  setText("cTotalPay", money(data.totalPay));

  setText("cToday", getTodayKorean());
}

async function saveEmployeeFromContract(data) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "saveEmployeeFromContract",
        employee: data
      })
    });

    const result = await response.json();

    if (result.success) {
      setMessage("정규직 근로계약서가 생성되었고, 인사관리대장에 저장되었습니다.");
    } else {
      setMessage(result.message || "계약서는 생성되었지만 인사관리대장 저장에 실패했습니다.");
    }

  } catch (err) {
    setMessage("계약서는 생성되었지만 저장 중 오류가 발생했습니다: " + err.message);
  }
}

function applyMoneyComma() {
  const moneyInputs = [
    "basePay",
    "overtimePay",
    "dutyPay",
    "positionPay",
    "mealPay",
    "totalPay"
  ];

  moneyInputs.forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener("input", function () {
      const onlyNumber = this.value.replace(/[^0-9]/g, "");
      this.value = onlyNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    });
  });
}

function getTodayKorean() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}년 ${m}월 ${d}일`;
}