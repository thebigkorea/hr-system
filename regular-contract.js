const API_URL =
  "https://script.google.com/macros/s/AKfycbzCO4TLMRGgt_OY-3T92mw58AAKcOwquq0ubepUEJgPO9YPeMV-hNeP7AHy7lvOPog7oQ/exec";

let canvas;
let ctx;
let drawing = false;
let currentContractId = null;

document.addEventListener("DOMContentLoaded", async () => {
  applyMoneyComma();
  initSignaturePad();

  const params = new URLSearchParams(window.location.search);
  const contractId = params.get("id");

  if (contractId) {
    currentContractId = contractId;
    await loadContractForWorker(contractId);
  }
});

async function loadContractForWorker(contractId) {
  setMessage("계약서를 불러오는 중입니다...");

  try {
    const result = await postData({
      action: "getContractById",
      contractId
    });

    if (!result.success) {
      setMessage(result.message || "계약서를 불러오지 못했습니다.");
      return;
    }

    fillContract(result.contract);

    const formBox = document.querySelector(".form-box");
    if (formBox) formBox.style.display = "none";

    setMessage("계약 내용을 확인한 뒤 전자서명을 진행해주세요.");

  } catch (err) {
    setMessage("계약서 조회 중 오류가 발생했습니다: " + err.message);
  }
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

function createContract() {
  const data = collectContractData();

  if (!validateContract(data)) return;

  fillContract(data);
  saveEmployeeFromContract(data);

  setMessage("근로계약서가 생성되었습니다. 이제 초록색 ‘계약 저장 및 직원 링크 생성’을 누르세요.");
}

async function saveContractAndCreateLink() {
  const data = collectContractData();

  if (!validateContract(data)) return;

  fillContract(data);

  const box = document.getElementById("contractLinkBox");
  const input = document.getElementById("contractLink");

  setMessage("계약을 저장하고 직원 링크를 생성 중입니다...");

  try {
    const result = await postData({
      action: "saveContractDraft",
      contract: data
    });

    if (!result.success) {
      setMessage(result.message || "계약 저장에 실패했습니다.");
      return;
    }

    currentContractId = result.contractId;

    if (box && input) {
      box.style.display = "block";
      input.value = result.link;
    }

    setMessage("계약이 Contracts 시트에 저장되었고 직원 링크가 생성되었습니다.");

  } catch (err) {
    setMessage("계약 저장 중 오류가 발생했습니다: " + err.message);
  }
}

function validateContract(data) {
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
      return false;
    }
  }

  return true;
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

async function completeElectronicContract(event) {
  const agree = document.getElementById("agreeCheck");
  const completeBtn = event ? event.target : null;

  if (!agree || !agree.checked) {
    setMessage("전자계약 동의 체크를 먼저 해주세요.");
    alert("전자계약 동의 체크를 먼저 해주세요.");
    return;
  }

  if (!canvas || isSignatureEmpty()) {
    setMessage("근로자 전자서명을 입력해주세요.");
    alert("근로자 전자서명을 입력해주세요.");
    return;
  }

  if (!currentContractId) {
    setMessage("계약번호가 없습니다. 직원 전용 링크로 다시 접속해주세요.");
    alert("계약번호가 없습니다. 직원 전용 링크로 다시 접속해주세요.");
    return;
  }

  if (completeBtn) {
    completeBtn.classList.add("loading-btn");
    completeBtn.innerText = "저장 중입니다...";
  }

  const signatureData = canvas.toDataURL("image/png");

  const img = document.getElementById("workerSignatureImage");
  if (img) {
    img.src = signatureData;
    img.style.display = "block";
  }

  const signedTime = document.getElementById("signedTime");
  if (signedTime) {
    signedTime.innerText = getTodayKorean() + " 전자서명 완료";
  }

  try {
    const result = await postData({
      action: "signContract",
      contractId: currentContractId,
      signature: signatureData
    });

    if (result.success) {
      setMessage("전자계약이 완료되었습니다. 회사에 정상 저장되었습니다.");

      const box = document.getElementById("completeBox");
      if (box) box.style.display = "block";

      if (completeBtn) {
        completeBtn.innerText = "전자계약 완료됨";
        completeBtn.style.background = "#059669";
      }

      alert("전자계약이 완료되었습니다. 회사에 정상 저장되었습니다.");
    } else {
      setMessage(result.message || "전자서명 저장에 실패했습니다.");
      alert(result.message || "전자서명 저장에 실패했습니다.");

      if (completeBtn) {
        completeBtn.innerText = "전자계약 완료";
        completeBtn.classList.remove("loading-btn");
      }
    }

  } catch (err) {
    setMessage("전자서명 저장 중 오류가 발생했습니다: " + err.message);
    alert("전자서명 저장 중 오류가 발생했습니다.");

    if (completeBtn) {
      completeBtn.innerText = "전자계약 완료";
      completeBtn.classList.remove("loading-btn");
    }
  }
}

function copyContractLink() {
  const input = document.getElementById("contractLink");

  if (!input || !input.value) {
    setMessage("복사할 링크가 없습니다.");
    return;
  }

  input.select();
  document.execCommand("copy");
  setMessage("직원 링크가 복사되었습니다. 카톡이나 문자로 직원에게 보내세요.");
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
  ["basePay", "overtimePay", "dutyPay", "positionPay", "mealPay", "totalPay"]
    .forEach(id => {
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
  document.body.classList.add("signing-lock");

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
  document.body.classList.remove("signing-lock");
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

  const completeBox = document.getElementById("completeBox");
  if (completeBox) completeBox.style.display = "none";
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