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
    "totalPay"
  ];

  for (const key of required) {
    if (!data[key]) {
      setMessage("필수 항목을 모두 입력해주세요.");
      return;
    }
  }

  fillContract(data);
  setMessage("정규직 근로계약서가 생성되었습니다. 아래 인쇄하기 버튼을 눌러 출력하거나 PDF로 저장하세요.");
}

function getValue(id) {
  return document.getElementById(id).value.trim();
}

function setText(id, value) {
  document.getElementById(id).innerText = value || "";
}

function money(value) {
  if (!value) return "0원";
  return `${value}원`;
}

function setMessage(msg) {
  document.getElementById("message").innerText = msg;
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

function getTodayKorean() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}년 ${m}월 ${d}일`;
}