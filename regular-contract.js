const API_URL =
  "https://script.google.com/macros/s/AKfycbzCO4TLMRGgt_OY-3T92mw58AAKcOwquq0ubepUEJgPO9YPeMV-hNeP7AHy7lvOPog7oQ/exec";

let canvas;
let ctx;
let drawing = false;
let currentContractId = null;

document.addEventListener("DOMContentLoaded", async () => {
  initTimeSelect();
  initMoneyInputs();
  initResidentNoAutoBirth();
  initSignaturePad();

  const params = new URLSearchParams(window.location.search);
  const contractId = params.get("id");

  if (contractId) {
    currentContractId = contractId;
    await loadContract(contractId);
  }
});

/* =========================
   출근/퇴근 시간 자동 생성
========================= */

function initTimeSelect() {
  const start = document.getElementById("startTime");
  const end = document.getElementById("endTime");

  if (!start || !end) return;

  start.innerHTML = `<option value="">출근시간 선택</option>`;
  end.innerHTML = `<option value="">퇴근시간 선택</option>`;

  for (let h = 0; h <= 23; h++) {
    ["00", "30"].forEach(m => {
      const time = `${String(h).padStart(2, "0")}:${m}`;

      const startOption = document.createElement("option");
      startOption.value = time;
      startOption.textContent = time;
      start.appendChild(startOption);

      const endOption = document.createElement("option");
      endOption.value = time;
      endOption.textContent = time;
      end.appendChild(endOption);
    });
  }

  start.value = "09:00";
  end.value = "21:00";
}

/* =========================
   주민번호 → 생년월일 자동
========================= */

function initResidentNoAutoBirth() {
  const residentInput = document.getElementById("residentNo");
  const birthInput = document.getElementById("birth");

  if (!residentInput || !birthInput) return;

  residentInput.addEventListener("input", function () {
    let value = this.value.replace(/[^0-9]/g, "");

    if (value.length > 6) {
      value = value.slice(0, 6) + "-" + value.slice(6, 13);
    }

    this.value = value;

    const birth = getBirthFromResidentNo(value);
    if (birth) birthInput.value = birth;
  });
}

function getBirthFromResidentNo(residentNo) {
  const nums = residentNo.replace(/[^0-9]/g, "");

  if (nums.length < 7) return "";

  const yy = nums.slice(0, 2);
  const mm = nums.slice(2, 4);
  const dd = nums.slice(4, 6);
  const genderCode = nums.slice(6, 7);

  let century = "19";

  if (genderCode === "1" || genderCode === "2") century = "19";
  if (genderCode === "3" || genderCode === "4") century = "20";
  if (genderCode === "5" || genderCode === "6") century = "19";
  if (genderCode === "7" || genderCode === "8") century = "20";

  return `${century}${yy}년 ${Number(mm)}월 ${Number(dd)}일`;
}

/* =========================
   임금 콤마 + 자동 합산
========================= */

function initMoneyInputs() {
  const ids = [
    "basePay",
    "overtimePay",
    "dutyPay",
    "positionPay",
    "mealPay"
  ];

  ids.forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;

    input.addEventListener("input", function () {
      const onlyNumber = this.value.replace(/[^0-9]/g, "");
      this.value = onlyNumber ? Number(onlyNumber).toLocaleString() : "";
      calculateTotalPay();
    });

    input.addEventListener("blur", calculateTotalPay);
  });

  calculateTotalPay();
}

function calculateTotalPay() {
  const ids = [
    "basePay",
    "overtimePay",
    "dutyPay",
    "positionPay",
    "mealPay"
  ];

  let total = 0;

  ids.forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;

    const number = Number(input.value.replace(/,/g, "") || 0);
    total += number;
  });

  const totalInput = document.getElementById("totalPay");
  if (totalInput) {
    totalInput.value = total ? total.toLocaleString() : "";
  }
}

/* =========================
   계약서 생성
========================= */

function createContract() {
  calculateTotalPay();

  const data = collectData();

  if (!validateData(data)) return;

  fillContract(data);
  saveEmployeeFromContract(data);

  setMessage("근로계약서가 생성되었습니다. 계약 저장 및 직원 링크 생성을 눌러주세요.");
}

function collectData() {
  calculateTotalPay();

  return {
    empName: value("empName"),
    residentNo: value("residentNo"),
    birth: value("birth"),
    phone: value("phone"),
    address: value("address"),
    bank: value("bank"),
    account: value("account"),

    joinDate: formatDateKorean(value("joinDate")),
    workDays: value("workDays"),
    monthHour: value("monthHour") || "209",
    workTime:
      value("startTime") && value("endTime")
        ? `${value("startTime")} ~ ${value("endTime")}`
        : "",
    breakTime: value("breakTime"),
    workPlace: value("workPlace"),
    jobDuty: value("jobDuty"),

    basePay: value("basePay"),
    overtimePay: value("overtimePay"),
    dutyPay: value("dutyPay"),
    positionPay: value("positionPay"),
    mealPay: value("mealPay"),
    totalPay: value("totalPay")
  };
}

function validateData(data) {
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
      alert("필수 항목을 모두 입력해주세요.");
      setMessage("필수 항목을 모두 입력해주세요.");
      return false;
    }
  }

  return true;
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

/* =========================
   계약 저장 + 직원 링크 생성
========================= */

async function saveContractAndCreateLink(event) {
  calculateTotalPay();

  const btn = event.target;
  const data = collectData();

  if (!validateData(data)) return;

  fillContract(data);

  btn.innerText = "처리중...";
  btn.disabled = true;
  setMessage("계약 저장 및 직원 링크 생성 중입니다...");

  try {
    const result = await postData({
      action: "saveContractDraft",
      contract: data
    });

    if (!result.success) {
      alert(result.message || "계약 저장 실패");
      setMessage(result.message || "계약 저장 실패");
      return;
    }

    currentContractId = result.contractId;

    document.getElementById("contractLinkBox").style.display = "block";
    document.getElementById("contractLink").value = result.link;

    setMessage("계약 저장 완료. 직원 링크가 생성되었습니다.");
    alert("계약 저장 및 직원 링크 생성이 완료되었습니다.");

  } catch (err) {
    alert("계약 저장 중 오류가 발생했습니다.");
    setMessage("계약 저장 중 오류: " + err.message);
  } finally {
    btn.innerText = "계약 저장 및 직원 링크 생성";
    btn.disabled = false;
  }
}

/* =========================
   직원 링크 계약서 불러오기
========================= */

async function loadContract(contractId) {
  try {
    const result = await postData({
      action: "getContractById",
      contractId
    });

    if (!result.success) {
      alert(result.message || "계약 조회 실패");
      return;
    }

    fillContract(result.contract);

    const formBox = document.querySelector(".form-box");
    if (formBox) formBox.style.display = "none";

    setMessage("계약 내용을 확인한 뒤 전자서명을 진행해주세요.");

  } catch (err) {
    alert("계약 불러오기 오류");
  }
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

/* =========================
   전자서명
========================= */

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

function startDraw(e) {
  drawing = true;
  document.body.style.overflow = "hidden";

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
  document.body.style.overflow = "auto";
}

function startDrawTouch(e) {
  e.preventDefault();
  startDraw(e.touches[0]);
}

function drawTouch(e) {
  e.preventDefault();
  draw(e.touches[0]);
}

function getCanvasPos(e) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height)
  };
}

function clearSignature() {
  if (!ctx || !canvas) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const img = document.getElementById("workerSignatureImage");
  if (img) img.src = "";

  const completeBox = document.getElementById("completeBox");
  if (completeBox) completeBox.style.display = "none";

  const signedTime = document.getElementById("signedTime");
  if (signedTime) signedTime.innerText = "";
}

async function completeElectronicContract(event) {
  const agree = document.getElementById("agreeCheck");

  if (!agree.checked) {
    alert("전자계약 동의 체크를 해주세요.");
    return;
  }

  if (isCanvasEmpty()) {
    alert("전자서명을 입력해주세요.");
    return;
  }

  if (!currentContractId) {
    alert("계약번호가 없습니다. 직원 전용 링크로 다시 접속해주세요.");
    return;
  }

  const btn = event.target;
  btn.innerText = "저장중...";
  btn.disabled = true;

  const signatureData = canvas.toDataURL("image/png");

  const img = document.getElementById("workerSignatureImage");
  img.src = signatureData;
  img.style.display = "block";

  document.getElementById("signedTime").innerText =
    getTodayKorean() + " 전자서명 완료";

  try {
    const result = await postData({
      action: "signContract",
      contractId: currentContractId,
      signature: signatureData
    });

    if (!result.success) {
      alert(result.message || "전자서명 저장 실패");
      return;
    }

    document.getElementById("completeBox").style.display = "block";
    btn.innerText = "전자계약 완료됨";
    btn.style.background = "#059669";

    alert("전자계약이 정상 완료되었습니다.");

  } catch (err) {
    alert("전자서명 오류");
  } finally {
    btn.disabled = false;
  }
}

/* =========================
   공통
========================= */

function copyContractLink() {
  const input = document.getElementById("contractLink");

  if (!input.value) {
    alert("복사할 링크가 없습니다.");
    return;
  }

  input.select();
  document.execCommand("copy");
  alert("직원 링크가 복사되었습니다.");
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

function withWon(v) {
  if (!v) return "0원";
  return `${v}원`;
}

function formatDateKorean(dateValue) {
  if (!dateValue) return "";
  if (!dateValue.includes("-")) return dateValue;

  const [y, m, d] = dateValue.split("-");
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

function getTodayKorean() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}년 ${m}월 ${d}일`;
}

function isCanvasEmpty() {
  const blank = document.createElement("canvas");
  blank.width = canvas.width;
  blank.height = canvas.height;
  return canvas.toDataURL() === blank.toDataURL();
}