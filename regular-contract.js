// regular-contract.js

const API_URL =
  "https://script.google.com/macros/s/AKfycbzCO4TLMRGgt_OY-3T92mw58AAKcOwquq0ubepUEJgPO9YPeMV-hNeP7AHy7lvOPog7oQ/exec";

let canvas;
let ctx;
let drawing = false;
let currentContractId = null;

document.addEventListener("DOMContentLoaded", async () => {

  initTimeSelect();
  initMoneyInputs();
  initSignaturePad();

  const params = new URLSearchParams(window.location.search);
  const contractId = params.get("id");

  if (contractId) {
    currentContractId = contractId;
    await loadContract(contractId);
  }
});


// =========================
// 시간 select 생성
// =========================

function initTimeSelect() {

  const start = document.getElementById("startTime");
  const end = document.getElementById("endTime");

  if (!start || !end) return;

  for (let h = 0; h < 24; h++) {

    ["00", "30"].forEach(m => {

      const value =
        String(h).padStart(2, "0") + ":" + m;

      const option1 = document.createElement("option");
      option1.value = value;
      option1.textContent = value;

      const option2 = document.createElement("option");
      option2.value = value;
      option2.textContent = value;

      start.appendChild(option1);
      end.appendChild(option2);
    });
  }
}


// =========================
// 금액 자동 콤마 + 합산
// =========================

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

    input.addEventListener("input", function () {

      let value =
        this.value.replace(/[^0-9]/g, "");

      value = Number(value || 0)
        .toLocaleString();

      this.value = value;

      calculateTotalPay();
    });
  });
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

    const value =
      document.getElementById(id)
      .value
      .replace(/,/g, "");

    total += Number(value || 0);
  });

  document.getElementById("totalPay").value =
    total.toLocaleString();
}


// =========================
// 계약서 생성
// =========================

function createContract() {

  const data = collectData();

  fillContract(data);

  setMessage(
    "근로계약서가 생성되었습니다."
  );
}

function collectData() {

  return {

    empName: value("empName"),
    residentNo: value("residentNo"),
    birth: value("birth"),
    phone: value("phone"),
    address: value("address"),

    bank: value("bank"),
    account: value("account"),

    joinDate: value("joinDate"),
    workDays: value("workDays"),
    monthHour: value("monthHour"),

    workTime:
      value("startTime") +
      " ~ " +
      value("endTime"),

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

function fillContract(data) {

  text("cEmpName", data.empName);
  text("cWorkerName", data.empName);

  text("cJoinDate", data.joinDate);

  text("cWorkPlace", data.workPlace);
  text("cJobDuty", data.jobDuty);

  text("cWorkDays", data.workDays);
  text("cWorkTime", data.workTime);
  text("cBreakTime", data.breakTime);

  text("cBasePay", data.basePay);
  text("cOvertimePay", data.overtimePay);
  text("cDutyPay", data.dutyPay);
  text("cPositionPay", data.positionPay);
  text("cMealPay", data.mealPay);
  text("cTotalPay", data.totalPay);
}


// =========================
// 계약 저장 + 링크 생성
// =========================

async function saveContractAndCreateLink() {

  const btn = event.target;

  btn.innerText = "처리중...";
  btn.disabled = true;

  const data = collectData();

  try {

    const result = await postData({

      action: "saveContractDraft",
      contract: data
    });

    if (!result.success) {

      alert(result.message || "저장 실패");
      return;
    }

    currentContractId =
      result.contractId;

    document
      .getElementById("contractLinkBox")
      .style.display = "block";

    document
      .getElementById("contractLink")
      .value = result.link;

    setMessage(
      "계약 저장 완료 및 직원 링크 생성 완료"
    );

    alert(
      "계약 저장이 완료되었습니다."
    );

  } catch (err) {

    alert("오류 발생");

  } finally {

    btn.innerText =
      "계약 저장 및 직원 링크 생성";

    btn.disabled = false;
  }
}


// =========================
// 직원 계약 불러오기
// =========================

async function loadContract(contractId) {

  try {

    const result = await postData({

      action: "getContractById",
      contractId
    });

    if (!result.success) {

      alert("계약 조회 실패");
      return;
    }

    fillContract(result.contract);

    const formBox =
      document.querySelector(".form-box");

    if (formBox)
      formBox.style.display = "none";

  } catch (err) {

    alert("계약 불러오기 오류");
  }
}


// =========================
// 전자서명
// =========================

function initSignaturePad() {

  canvas =
    document.getElementById("signaturePad");

  if (!canvas) return;

  ctx =
    canvas.getContext("2d");

  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#111";

  canvas.addEventListener(
    "mousedown",
    startDraw
  );

  canvas.addEventListener(
    "mousemove",
    draw
  );

  canvas.addEventListener(
    "mouseup",
    endDraw
  );

  canvas.addEventListener(
    "mouseleave",
    endDraw
  );

  canvas.addEventListener(
    "touchstart",
    startDrawTouch,
    { passive:false }
  );

  canvas.addEventListener(
    "touchmove",
    drawTouch,
    { passive:false }
  );

  canvas.addEventListener(
    "touchend",
    endDraw
  );
}

function startDraw(e) {

  drawing = true;

  document.body.style.overflow =
    "hidden";

  const pos =
    getCanvasPos(e);

  ctx.beginPath();

  ctx.moveTo(
    pos.x,
    pos.y
  );
}

function draw(e) {

  if (!drawing) return;

  const pos =
    getCanvasPos(e);

  ctx.lineTo(
    pos.x,
    pos.y
  );

  ctx.stroke();
}

function endDraw() {

  drawing = false;

  document.body.style.overflow =
    "auto";
}

function startDrawTouch(e) {

  e.preventDefault();

  startDraw(
    e.touches[0]
  );
}

function drawTouch(e) {

  e.preventDefault();

  draw(
    e.touches[0]
  );
}

function getCanvasPos(e) {

  const rect =
    canvas.getBoundingClientRect();

  return {

    x:
      (e.clientX - rect.left) *
      (canvas.width / rect.width),

    y:
      (e.clientY - rect.top) *
      (canvas.height / rect.height)
  };
}

function clearSignature() {

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  document
    .getElementById("workerSignatureImage")
    .src = "";

  document
    .getElementById("completeBox")
    .style.display = "none";
}


// =========================
// 전자계약 완료
// =========================

async function completeElectronicContract(event) {

  const agree =
    document.getElementById("agreeCheck");

  if (!agree.checked) {

    alert(
      "전자계약 동의 체크를 해주세요."
    );

    return;
  }

  if (isCanvasEmpty()) {

    alert(
      "전자서명을 입력해주세요."
    );

    return;
  }

  const btn = event.target;

  btn.innerText = "저장중...";
  btn.disabled = true;

  const signatureData =
    canvas.toDataURL("image/png");

  document
    .getElementById("workerSignatureImage")
    .src = signatureData;

  document
    .getElementById("signedTime")
    .innerText =
      new Date().toLocaleString();

  try {

    const result = await postData({

      action: "signContract",

      contractId:
        currentContractId,

      signature:
        signatureData
    });

    if (!result.success) {

      alert(
        result.message || "저장 실패"
      );

      return;
    }

    document
      .getElementById("completeBox")
      .style.display = "block";

    btn.innerText =
      "전자계약 완료됨";

    btn.style.background =
      "#059669";

    alert(
      "전자계약이 정상 완료되었습니다."
    );

  } catch (err) {

    alert("전자서명 오류");

  } finally {

    btn.disabled = false;
  }
}


// =========================
// 링크 복사
// =========================

function copyContractLink() {

  const input =
    document.getElementById("contractLink");

  input.select();

  document.execCommand("copy");

  alert(
    "직원 링크가 복사되었습니다."
  );
}


// =========================
// 공통
// =========================

async function postData(data) {

  const response = await fetch(
    API_URL,
    {
      method:"POST",
      body:JSON.stringify(data)
    }
  );

  return await response.json();
}

function value(id) {

  return document
    .getElementById(id)
    .value
    .trim();
}

function text(id, value) {

  const el =
    document.getElementById(id);

  if (el)
    el.innerText = value || "";
}

function setMessage(msg) {

  document
    .getElementById("message")
    .innerText = msg;
}

function isCanvasEmpty() {

  const blank =
    document.createElement("canvas");

  blank.width =
    canvas.width;

  blank.height =
    canvas.height;

  return (
    canvas.toDataURL() ===
    blank.toDataURL()
  );
}