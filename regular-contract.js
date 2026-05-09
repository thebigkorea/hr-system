const API_URL =
  "https://script.google.com/macros/s/AKfycbzCO4TLMRGgt_OY-3T92mw58AAKcOwquq0ubepUEJgPO9YPeMV-hNeP7AHy7lvOPog7oQ/exec";

let canvas;
let ctx;
let drawing = false;
let currentContractId = null;
let isWorkerMode = false;

document.addEventListener("DOMContentLoaded", async () => {
  applyMoneyComma();
  initSignaturePad();

  const params = new URLSearchParams(window.location.search);
  const contractId = params.get("id");

  if (contractId) {
    isWorkerMode = true;
    currentContractId = contractId;
    await loadContractForWorker(contractId);
  }
});

async function loadContractForWorker(contractId) {
  setMessage("계약서를 불러오는 중입니다...");

  const result = await postData({
    action: "getContractById",
    contractId
  });

  if (!result.success) {
    setMessage(result.message || "계약서를 불러오지 못했습니다.");
    return;
  }

  fillContract(result.contract);

  document.querySelector(".form-box").style.display = "none";
  setMessage("계약 내용을 확인한 뒤 전자서명을 진행해주세요.");
}

function createContract() {
  const data = collectContractData();

  const required = [
    "empName", "residentNo", "birth", "phone", "address",
    "joinDate", "workDays", "workTime", "breakTime",
    "workPlace", "jobDuty", "basePay", "totalPay"
  ];

  for (const key of required) {
    if (!data[key]) {
      setMessage("필수 항목을 모두 입력해주세요.");
      return;
    }
  }

  fillContract(data);
  saveEmployeeFromContract(data);

  setMessage("계약서가 생성되었습니다. 아래에서 계약 저장 및 직원 링크 생성을 누르세요.");
}

async function saveContractAndCreateLink() {
  const data = collectContractData();

  if (!data.empName || !data.residentNo) {
    setMessage("직원명과 주민등록번호는 반드시 입력해야 합니다.");
    return;
  }

  const result = await postData({
    action: "saveContractDraft",
    contract: data
  });

  if (!result.success) {
    setMessage(result.message || "계약 저장 실패");
    return;
  }

  currentContractId = result.contractId;

  const linkBox = document.getElementById("contractLinkBox");
  const linkInput = document.getElementById("contractLink");

  if (linkBox && linkInput) {
    linkBox.style.display = "block";
    linkInput.value = result.link;
  }

  setMessage("직원 전용 계약 링크가 생성되었습니다. 링크를 복사해 직원에게 보내세요.");
}

function collectContractData() {
  return {
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
}

async function saveEmployeeFromContract(data) {
  try {
    await postData({
      action: "saveEmployeeFromContract",
      employee: data
    });
  } catch (err) {
    console.log(err);
  }
}

async function postData(data) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(data)
  });

  return await response.json();
}

function fillContract(data) {
  setText("cEmpName", data.empName);
  setText("cWorkerName", data.empName);
  setText("cResidentNo", data.residentNo);
  setText("cBirth", data.birth);
  setText("cPhone", data.phone);
  setText("cAddress", data.address);
  setText("cBankAccount", `${data.bank || ""} ${data.account || ""}`);

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

async function completeElectronicContract() {
  const agree = document.getElementById("agreeCheck");

  if (!agree || !agree.checked) {
    setMessage("전자계약 동의 체크를 먼저 해주세요.");
    return;
  }

  if (!canvas || isSignatureEmpty()) {
    setMessage("근로자 전자서명을 입력해주세요.");
    return;
  }

  const signatureData = canvas.toDataURL("image/png");

  const img = document.getElementById("workerSignatureImage");
  img.src = signatureData;
  img.style.display = "block";

  const now = getTodayKorean() + " 전자서명 완료";
  document.getElementById("signedTime").innerText = now;

  if (currentContractId) {
    const result = await postData({
      action: "signContract",
      contractId: currentContractId,
      signature: signatureData
    });

    if (!result.success) {
      setMessage(result.message || "서명 저장 실패");
      return;
    }
  }

  setMessage("전자계약이 완료되었습니다. 인쇄 또는 PDF 저장을 진행하세요.");
}

function copyContractLink() {
  const input = document.getElementById("contractLink");
  input.select();
  document.execCommand("copy");
  setMessage("직원 링크가 복사되었습니다.");
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

function applyMoneyComma() {
  const moneyInputs = ["basePay", "overtimePay", "dutyPay", "positionPay", "mealPay", "totalPay"];

  moneyInputs.forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener("input", function () {
      const onlyNumber = this.value.replace(/[^0-9]/g, "");
      this.value = onlyNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    });
  });
}

function initSignaturePad() {
  canvas = document.getElementById("signaturePad");
  if (!canvas) return;

  ctx = canvas.getContext("2d");
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#111";

  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", endDraw);
  canvas.addEventListener("mouseleave", endDraw);

  canvas.addEventListener("touchstart", startDrawTouch, { passive:false });
  canvas.addEventListener("touchmove", drawTouch, { passive:false });
  canvas.addEventListener("touchend", endDraw);
}

function getCanvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height)
  };
}

function startDraw(e) {
  drawing = true;
  const pos = getCanvasPos(e);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}

function draw(e) {
  if (!drawing) return;
  const pos = getCanvasPos(e);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
}

function endDraw() {
  drawing = false;
}

function startDrawTouch(e) {
  e.preventDefault();
  startDraw(e.touches[0]);
}

function drawTouch(e) {
  e.preventDefault();
  draw(e.touches[0]);
}

function clearSignature() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const img = document.getElementById("workerSignatureImage");
  if (img) {
    img.src = "";
    img.style.display = "none";
  }

  const signedTime = document.getElementById("signedTime");
  if (signedTime) signedTime.innerText = "";
}

function isSignatureEmpty() {
  const blank = document.createElement("canvas");
  blank.width = canvas.width;
  blank.height = canvas.height;
  return canvas.toDataURL() === blank.toDataURL();
}

function getTodayKorean() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}년 ${m}월 ${d}일`;
}