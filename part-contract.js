const API_URL =
  "https://script.google.com/macros/s/AKfycbzCO4TLMRGgt_OY-3T92mw58AAKcOwquq0ubepUEJgPO9YPeMV-hNeP7AHy7lvOPog7oQ/exec";

let canvas;
let ctx;
let drawing = false;
let currentContractId = null;

document.addEventListener("DOMContentLoaded", async () => {
  initTimeSelect();
  initResidentNoAutoBirth();
  initMoneyInput();
  initSignaturePad();

  const id = new URLSearchParams(window.location.search).get("id");
  if (id) {
    currentContractId = id;
    await loadContract(id);
  }
});

function initTimeSelect() {
  const start = document.getElementById("startTime");
  const end = document.getElementById("endTime");

  if (!start || !end) return;

  start.innerHTML = `<option value="">출근시간 선택</option>`;
  end.innerHTML = `<option value="">퇴근시간 선택</option>`;

  for (let h = 0; h < 24; h++) {
    ["00", "30"].forEach(m => {
      const t = `${String(h).padStart(2, "0")}:${m}`;
      start.add(new Option(t, t));
      end.add(new Option(t, t));
    });
  }
}

function initResidentNoAutoBirth() {
  const resident = document.getElementById("residentNo");
  const birth = document.getElementById("birth");

  if (!resident || !birth) return;

  resident.addEventListener("input", function () {
    let v = this.value.replace(/[^0-9]/g, "");

    if (v.length > 6) {
      v = v.slice(0, 6) + "-" + v.slice(6, 13);
    }

    this.value = v;

    const nums = v.replace(/[^0-9]/g, "");
    if (nums.length >= 7) {
      birth.value = getBirth(v);
    }
  });
}

function getBirth(no) {
  const n = no.replace(/[^0-9]/g, "");
  const yy = n.slice(0, 2);
  const mm = n.slice(2, 4);
  const dd = n.slice(4, 6);
  const g = n.slice(6, 7);

  let c = "19";
  if (g === "3" || g === "4" || g === "7" || g === "8") c = "20";

  return `${c}${yy}년 ${Number(mm)}월 ${Number(dd)}일`;
}

function initMoneyInput() {
  const input = document.getElementById("hourPay");
  if (!input) return;

  input.addEventListener("input", function () {
    const n = this.value.replace(/[^0-9]/g, "");
    this.value = n ? Number(n).toLocaleString() : "";
  });
}

function collectData() {
  return {
    contractType: "계약직(아르바이트) 근로계약서",

    empName: value("empName"),
    residentNo: value("residentNo"),
    birth: value("birth"),
    phone: value("phone"),
    address: value("address"),

    startDate: formatDate(value("startDate")),
    endDate: formatDate(value("endDate")),
    workDays: value("workDays"),
    holiday: value("holiday"),

    startTime: value("startTime"),
    endTime: value("endTime"),
    breakTime: value("breakTime"),
    jobDuty: value("jobDuty"),
    hourPay: value("hourPay"),
    insurance: value("insurance"),

    workPlace: "한국의집 롯데월드몰점",
    representative: "박병호"
  };
}

function validateData(d) {
  const required = [
    "empName",
    "residentNo",
    "birth",
    "phone",
    "address",
    "startDate",
    "endDate",
    "workDays",
    "startTime",
    "endTime",
    "breakTime",
    "jobDuty",
    "hourPay"
  ];

  for (const k of required) {
    if (!d[k]) {
      alert("필수 항목을 모두 입력해주세요.");
      return false;
    }
  }

  return true;
}

function createContract() {
  const d = collectData();

  if (!validateData(d)) return;

  fillContract(d);
  setMessage("계약직(아르바이트) 근로계약서가 생성되었습니다.");
  alert("계약직(아르바이트) 근로계약서가 생성되었습니다.");
}

async function saveContractAndCreateLink(event) {
  const btn = event.target;
  const d = collectData();

  if (!validateData(d)) return;

  fillContract(d);

  btn.disabled = true;
  btn.innerText = "처리중...";
  setMessage("계약 저장 및 직원 링크 생성 중입니다...");

  try {
    const result = await postData({
      action: "saveContractDraft",
      contract: d
    });

    console.log("저장결과:", result);

    if (!result || !result.success) {
      alert((result && result.message) ? result.message : "계약 저장 실패");
      setMessage((result && result.message) ? result.message : "계약 저장 실패");
      return;
    }

    currentContractId = result.contractId;

    const link =
      `https://thebigkorea.github.io/hr-system/part-contract.html?id=${encodeURIComponent(result.contractId)}`;

    document.getElementById("contractLinkBox").style.display = "block";
    document.getElementById("contractLink").value = link;

    setMessage("계약 저장 완료. 직원 링크가 생성되었습니다.");
    alert("계약 저장 및 직원 링크 생성이 완료되었습니다.");

  } catch (e) {
    console.error(e);
    alert("저장 중 오류가 발생했습니다. Apps Script 배포 또는 인터넷 연결을 확인해주세요.");
    setMessage("저장 중 오류가 발생했습니다.");
  } finally {
    btn.disabled = false;
    btn.innerText = "계약 저장 및 직원 링크 생성";
  }
}

async function loadContract(id) {
  try {
    const result = await postData({
      action: "getContractById",
      contractId: id
    });

    if (!result.success) {
      alert(result.message || "계약 조회 실패");
      return;
    }

    currentContractId = id;

    fillContract(result.contract || {});

    const form = document.querySelector(".form-box");
    if (form) form.style.display = "none";

    setMessage("계약 내용을 확인한 뒤 전자서명을 진행해주세요.");

  } catch (e) {
    alert("계약서를 불러오는 중 오류가 발생했습니다.");
  }
}

function fillContract(d) {
  text("cEmpName", d.empName);
  text("cWorkerName", d.empName);
  text("cResidentNo", d.residentNo);
  text("cBirth", d.birth);
  text("cAddress", d.address);
  text("cPhone", d.phone);

  text("cStartDate", d.startDate);
  text("cEndDate", d.endDate);
  text("cJobDuty", d.jobDuty);
  text("cStartTime", d.startTime);
  text("cEndTime", d.endTime);
  text("cBreakTime", d.breakTime);
  text("cWorkDays", d.workDays);
  text("cHoliday", d.holiday || "선택 안함");
  text("cHourPay", d.hourPay ? `${d.hourPay}원` : "");
  text("cInsurance", d.insurance);
  text("cInsuranceText", d.insurance || "");
  text("cToday", getTodayKorean());
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

  canvas.addEventListener("touchstart", startDrawTouch, { passive: false });
  canvas.addEventListener("touchmove", drawTouch, { passive: false });
  canvas.addEventListener("touchend", endDraw);
}

function startDraw(e) {
  drawing = true;
  document.body.style.overflow = "hidden";

  const p = getPos(e);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
}

function draw(e) {
  if (!drawing) return;

  const p = getPos(e);
  ctx.lineTo(p.x, p.y);
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

function getPos(e) {
  const r = canvas.getBoundingClientRect();

  return {
    x: (e.clientX - r.left) * (canvas.width / r.width),
    y: (e.clientY - r.top) * (canvas.height / r.height)
  };
}

function clearSignature() {
  if (!ctx || !canvas) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const img = document.getElementById("workerSignatureImage");
  if (img) {
    img.src = "";
    img.style.display = "none";
  }

  const completeBox = document.getElementById("completeBox");
  if (completeBox) completeBox.style.display = "none";

  const signedTime = document.getElementById("signedTime");
  if (signedTime) signedTime.innerText = "";
}

async function completeElectronicContract(event) {
  const agree = document.getElementById("agreeCheck");

  if (!agree || !agree.checked) {
    alert("전자계약 동의 체크를 해주세요.");
    return;
  }

  if (isCanvasEmpty()) {
    alert("전자서명을 입력해주세요.");
    return;
  }

  if (!currentContractId) {
    alert("계약번호가 없습니다. 직원 링크로 다시 접속해주세요.");
    return;
  }

  const btn = event.target;
  btn.disabled = true;
  btn.innerText = "저장중...";

  const signature = canvas.toDataURL("image/png");

  const img = document.getElementById("workerSignatureImage");
  if (img) {
    img.src = signature;
    img.style.display = "block";
  }

  const signedTime = document.getElementById("signedTime");
  if (signedTime) {
    signedTime.innerText = new Date().toLocaleString() + " 전자서명 완료";
  }

  try {
    const result = await postData({
      action: "signContract",
      contractId: currentContractId,
      signature
    });

    if (result.success) {
      const completeBox = document.getElementById("completeBox");
      if (completeBox) completeBox.style.display = "block";

      btn.innerText = "전자계약 완료됨";
      setMessage("전자계약이 정상 완료되었습니다.");
      alert("전자계약이 정상 완료되었습니다.");
    } else {
      alert(result.message || "서명 저장 실패");
      btn.disabled = false;
      btn.innerText = "전자계약 완료";
    }
  } catch (e) {
    alert("전자서명 저장 중 오류가 발생했습니다.");
    btn.disabled = false;
    btn.innerText = "전자계약 완료";
  }
}

function copyContractLink() {
  const input = document.getElementById("contractLink");

  if (!input || !input.value) {
    alert("복사할 링크가 없습니다.");
    return;
  }

  input.select();
  document.execCommand("copy");
  alert("직원 링크가 복사되었습니다.");
}

async function postData(data) {
  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(data)
  });

  return await res.json();
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

function formatDate(v) {
  if (!v) return "";
  const [y, m, d] = v.split("-");
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

function getTodayKorean() {
  const today = new Date();
  return `${today.getFullYear()}년 ${String(today.getMonth() + 1).padStart(2, "0")}월 ${String(today.getDate()).padStart(2, "0")}일`;
}

function isCanvasEmpty() {
  const blank = document.createElement("canvas");
  blank.width = canvas.width;
  blank.height = canvas.height;
  return canvas.toDataURL() === blank.toDataURL();
}
document.addEventListener("input", function(e) {
  const el = e.target;
  if (!el || !el.id) return;

  const moneyIds = [
    "basePay", "overtimePay", "dutyPay", "positionPay",
    "mealPay", "totalPay", "hourPay", "servicePay"
  ];

  if (moneyIds.includes(el.id)) {
    const n = el.value.replace(/[^0-9]/g, "");
    el.value = n ? Number(n).toLocaleString() : "";
  }

  if (el.id === "residentNo") {
    let n = el.value.replace(/[^0-9]/g, "").slice(0, 13);
    if (n.length > 6) n = n.slice(0, 6) + "-" + n.slice(6);
    el.value = n;

    const birth = document.getElementById("birth");
    if (birth && n.length >= 8) {
      birth.value = getBirthFromResidentNo(n);
    }
  }

  if (el.id === "phone") {
    let n = el.value.replace(/[^0-9]/g, "").slice(0, 11);
    if (n.length <= 3) el.value = n;
    else if (n.length <= 7) el.value = n.slice(0, 3) + "-" + n.slice(3);
    else el.value = n.slice(0, 3) + "-" + n.slice(3, 7) + "-" + n.slice(7);
  }
});

function getBirthFromResidentNo(v) {
  const n = String(v).replace(/[^0-9]/g, "");
  const yy = n.slice(0, 2);
  const mm = n.slice(2, 4);
  const dd = n.slice(4, 6);
  const g = n.slice(6, 7);

  let century = "19";
  if (["3", "4", "7", "8"].includes(g)) century = "20";

  return `${century}${yy}년 ${Number(mm)}월 ${Number(dd)}일`;
}