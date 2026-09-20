const API_URL =
  "https://script.google.com/macros/s/AKfycbwRGQcXgYhfkTUiklPrHs4uFe7oHpgn8D_jM2jJPpU74tXr3D_h6vGMq72CHXU0EnAb/exec";



const WORKPLACES = {
  hq: {
    workplaceName: "더큰코리아 본사",
    companyName: "주식회사 더큰코리아",
    representative: "박병호",
    address: "대전광역시 유성구 테크노4로 29 201호",
    phone: "042-712-5035"
  },
  koreahouse_jamsil: {
    workplaceName: "한국의집 롯데월드몰점",
    companyName: "한국의집 롯데월드몰점",
    representative: "박병호",
    address: "서울특별시 송파구 올림픽로 300, 롯데월드몰 5층",
    phone: "042-712-5035"
  },
  gilchaejeong_apgujeong: {
    workplaceName: "길채정 압구정",
    companyName: "길채정 압구정",
    representative: "박병호",
    address: "서울특별시 강남구 압구정로 343, 갤러리아백화점",
    phone: "042-712-5035"
  },
  sobagongbang_pyeongchon: {
    workplaceName: "평촌 소바공방",
    companyName: "소바공방 평촌점",
    representative: "박병호",
    address: "경기도 안양시 동안구 시민대로 180, 롯데백화점 평촌점",
    phone: "042-712-5035"
  },
  koreahouse_hyojonggang_paju: {
    workplaceName: "한국의집 효종갱 파주",
    companyName: "한국의집 효종갱 파주",
    representative: "박병호",
    address: "경기도 파주시 필승로 200, 파주프리미엄아울렛",
    phone: "042-712-5035"
  }
};

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
  const w = companyInfoForCurrentForm();
  const dutyRaw = value("jobDuty");
  const duty = dutyRaw === "기타" ? (value("jobDutyEtc") || "기타") : dutyRaw;

  return {
    contractType: value("contractType") || "계약직(아르바이트) 근로계약서",
    workplaceCode: value("workplaceCode"),
    workplaceName: w.workplaceName,
    companyName: w.companyName,
    companyRepresentative: w.representative,
    companyAddress: w.address,
    companyPhone: w.phone,

    empName: value("empName"),
    residentNo: value("residentNo"),
    birth: value("birth"),
    phone: value("phone"),
    address: value("address"),

    startDate: formatDate(value("startDate")),
    endDate: formatDate(value("endDate")),
    startDateRaw: value("startDate"),
    endDateRaw: value("endDate"),
    workDays: value("workDays"),
    holiday: value("holiday"),
    weeklyHolidayPay: value("weeklyHolidayPay"),

    startTime: value("startTime"),
    endTime: value("endTime"),
    workTime: `${value("startTime")} ~ ${value("endTime")}`,
    breakTime: value("breakTime"),
    workPlace: value("workPlace") || w.workplaceName,
    jobDuty: duty,

    hourPay: value("hourPay"),
    payType: "시급제",
    insurance: value("insurance"),
    bankName: value("bankName"),
    bankAccount: value("bankAccount"),
    bank: value("bankName"),
    account: value("bankAccount"),

    representative: w.representative
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

  renderCurrentPreview(d);
  setMessage("계약직·아르바이트 근로계약서가 생성되었습니다.");
}

async function saveContractAndCreateLink(event) {
  const btn = event?.target || document.getElementById("saveBtn");
  const d = collectData();

  if (!validateData(d)) return;

  renderCurrentPreview(d);

  if (btn) {
    btn.disabled = true;
    btn.innerText = "처리중...";
  }

  setMessage("계약 저장 및 직원 링크 생성 중입니다...");

  try {
    const erpToken = localStorage.getItem("thebigkorea_erp_session") || "";

    if (!erpToken) {
      alert("ERP 로그인이 필요합니다.");
      setMessage("ERP 로그인 후 다시 시도해주세요.");
      return;
    }

    const result = await postData({
      action: "saveContractDraft",
      erpToken: erpToken,
      ...d,
      data: d,
      contract: d
    });

    if (!result || !result.success) {
      const msg = result?.message || "계약 저장 실패";
      alert(msg);
      setMessage(msg);
      return;
    }

    currentContractId = result.contractId;
    showLinkResult(result.contractId, result.contractUrl || result.secureUrl || result.url || "", result.publicToken || result.token || "");

    setMessage("계약 저장 완료. 직원 링크가 생성되었습니다.");
    alert("계약 저장 및 직원 링크 생성이 완료되었습니다.");

  } catch (e) {
    console.error(e);
    alert("저장 중 오류가 발생했습니다.\n" + (e.message || ""));
    setMessage("저장 중 오류가 발생했습니다.");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = "계약 저장 및 직원 링크 생성";
    }
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


/* =========================================================
   현재 입력 HTML 호환 / 미리보기 / 링크 생성
   - 완료본은 기존 thebigkorea-hq/contract-view.html 사용
   - contract-view.html의 기존 디자인은 건드리지 않음
========================================================= */
function selectedText(id) {
  const el = document.getElementById(id);
  if (!el || el.selectedIndex < 0) return "";
  return (el.options[el.selectedIndex]?.text || "").trim();
}

function escHtml(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function showPreviewHtml(title, rows, d) {
  const preview = document.getElementById("preview");
  if (!preview) return;

  const body = rows.map(([label, val]) => `
    <tr>
      <th style="width:28%;padding:10px;border:1px solid #d7dee8;background:#f7f9fc;text-align:left;">${escHtml(label)}</th>
      <td style="padding:10px;border:1px solid #d7dee8;">${escHtml(val || "")}</td>
    </tr>
  `).join("");

  preview.innerHTML = `
    <div style="padding:28px;background:#fff;color:#172033;font-family:Arial,'Noto Sans KR',sans-serif;">
      <h2 style="margin:0 0 22px;text-align:center;font-size:26px;">${escHtml(title)}</h2>
      <p style="margin:0 0 20px;line-height:1.7;">
        <strong>${escHtml(d.workplaceName || d.workPlace || "주식회사 더큰코리아")}</strong>와
        <strong>${escHtml(d.empName || "")}</strong>은 아래 내용으로 계약을 체결합니다.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">${body}</table>
      <div style="margin-top:24px;display:flex;gap:20px;flex-wrap:wrap;">
        <div style="flex:1;min-width:260px;padding:16px;border:1px solid #d7dee8;border-radius:10px;">
          <strong>[사업주]</strong><br><br>
          상호: ${escHtml(d.workplaceName || d.workPlace || "주식회사 더큰코리아")}<br>
          대표자: ${escHtml(d.representative || "박병호")}
        </div>
        <div style="flex:1;min-width:260px;padding:16px;border:1px solid #d7dee8;border-radius:10px;">
          <strong>[근로자/제공자]</strong><br><br>
          성명: ${escHtml(d.empName || "")}<br>
          연락처: ${escHtml(d.phone || "")}
        </div>
      </div>
    </div>
  `;
}

function showLinkResult(contractId, serverUrl, publicToken) {
  let link = String(serverUrl || "").trim();
  // 폐기된 hr-system 주소가 서버에서 넘어와도 현재 운영 저장소로 강제 전환
  link = link.replace(
    "https://thebigkorea.github.io/hr-system/contract-view.html",
    "https://thebigkorea.github.io/thebigkorea-hq/contract-view.html"
  );

  // 서버가 URL 대신 publicToken을 별도로 반환하는 경우에도 보안 링크 생성
  if (!link && publicToken) {
    link =
      "https://thebigkorea.github.io/thebigkorea-hq/contract-view.html?id=" +
      encodeURIComponent(contractId) +
      "&token=" + encodeURIComponent(publicToken);
  }

  if (!link) {
    alert("보안 계약 링크를 서버에서 받지 못했습니다. 계약은 저장되었지만 직원에게 링크를 보내지 마세요.");
    setMessage("계약은 저장되었지만 보안 링크 생성에 실패했습니다.");
    return "";
  }

  const box = document.getElementById("resultBox");
  if (box) {
    const buttons = document.querySelector(".buttons");
    if (buttons && box.parentNode) {
      buttons.insertAdjacentElement("afterend", box);
    }

    box.style.display = "block";
    box.innerHTML = `
      <strong>계약서가 저장되었습니다.</strong><br>
      계약번호 : ${escHtml(contractId)}<br>
      직원에게 아래 보안 링크를 보내 전자서명을 진행하세요.
      <input id="contractLink" value="${escHtml(link)}" readonly
             style="width:100%;box-sizing:border-box;margin:12px 0;padding:12px;">
      <button type="button" onclick="copyContractLink()"
              style="width:100%;padding:12px;">직원 링크 복사</button>
    `;
  }

  return link;
}

function makePreview() {
  createContract();
}

function saveContract() {
  const btn = document.getElementById("saveBtn");
  saveContractAndCreateLink({ target: btn });
}

function renderCurrentPreview(d) {
  const preview = document.getElementById("preview");
  if (!preview) return;

  const intro =
    `<strong>${escHtml(d.companyName || "")}</strong>(이하 “사업주”라 함)과 근로자 ` +
    `<strong>${escHtml(d.empName || "")}</strong>(이하 “근로자”라 함)은 다음과 같이 근로계약을 체결한다.`;

  const clauses = [
    ["근로계약기간", `${escHtml(d.startDate)}부터 ${escHtml(d.endDate)}까지`],
    ["근무장소", escHtml(d.workPlace)],
    ["업무내용", escHtml(d.jobDuty)],
    ["근로시간",
      `<table style="width:100%;border-collapse:collapse;text-align:center;">
        <tr><th style="border:1px solid #ccd6e3;padding:10px;">근무일수</th>
            <th style="border:1px solid #ccd6e3;padding:10px;">출근시간</th>
            <th style="border:1px solid #ccd6e3;padding:10px;">퇴근시간</th>
            <th style="border:1px solid #ccd6e3;padding:10px;">휴게시간</th></tr>
        <tr><td style="border:1px solid #ccd6e3;padding:10px;">${escHtml(d.workDays)}</td>
            <td style="border:1px solid #ccd6e3;padding:10px;">${escHtml(d.startTime)}</td>
            <td style="border:1px solid #ccd6e3;padding:10px;">${escHtml(d.endTime)}</td>
            <td style="border:1px solid #ccd6e3;padding:10px;">${escHtml(d.breakTime)}</td></tr>
      </table>`],
    ["근무일 / 휴일", `${escHtml(d.workDays)} 근무 / 주휴수당 : ${escHtml(d.weeklyHolidayPay || d.holiday || "선택 안함")}`],
    ["임금",
      `<table style="width:100%;border-collapse:collapse;text-align:center;">
        <tr><th style="border:1px solid #ccd6e3;padding:10px;">구분</th>
            <th style="border:1px solid #ccd6e3;padding:10px;">내용</th></tr>
        <tr><td style="border:1px solid #ccd6e3;padding:10px;">시급</td>
            <td style="border:1px solid #ccd6e3;padding:10px;">${escHtml(d.hourPay)}원</td></tr>
        <tr><td style="border:1px solid #ccd6e3;padding:10px;">4대보험</td>
            <td style="border:1px solid #ccd6e3;padding:10px;">${escHtml(d.insurance)}</td></tr>
      </table>
      <p>급여계좌 : ${escHtml((d.bankName + " " + d.bankAccount).trim())}</p>`],
    ["근로계약서 교부", "근로자는 본 근로계약서를 전자문서 방식으로 교부받았음을 확인한다."],
    ["전자계약 및 전자서명", "본 계약은 전자문서 및 전자서명 방식으로 체결할 수 있으며 전자서명은 자필서명 또는 날인과 동일한 효력을 가진다."]
  ];

  preview.innerHTML = contractPaperHtml(
    d.contractType || "계약직·아르바이트 근로계약서",
    intro, clauses, d, "근로자"
  );
}



function companyInfoForCurrentForm() {
  const code = value("workplaceCode") || "hq";
  return WORKPLACES[code] || WORKPLACES.hq;
}

function contractPaperHtml(title, intro, clauses, d, workerLabel) {
  const w = {
    companyName: d.companyName || "주식회사 더큰코리아",
    representative: d.companyRepresentative || d.representative || "박병호",
    address: d.companyAddress || "",
    phone: d.companyPhone || ""
  };

  const clauseHtml = clauses.map((item, idx) => `
    <section style="margin:26px 0;">
      <h3 style="margin:0 0 10px;padding-left:10px;border-left:5px solid #24497f;
                 font-size:19px;color:#173b70;">${idx + 1}. ${escHtml(item[0])}</h3>
      <div style="font-size:15px;line-height:1.85;white-space:normal;">${item[1]}</div>
    </section>
  `).join("");

  return `
    <div style="max-width:900px;margin:0 auto;background:#fff;padding:42px 38px;
                color:#111;font-family:'Malgun Gothic','Noto Sans KR',sans-serif;">
      <h1 style="text-align:center;font-size:30px;letter-spacing:2px;margin:0 0 28px;">
        ${escHtml(title)}
      </h1>

      <p style="font-size:15px;line-height:1.9;margin:0 0 30px;">${intro}</p>

      ${clauseHtml}

      <p style="margin:34px 0 18px;text-align:center;font-weight:700;">
        당사자는 상기 계약의 내용을 명확히 숙지하고 계약 체결하였음을 확인한다.
      </p>

      <div style="text-align:center;font-weight:700;margin-bottom:28px;">
        ${escHtml(getTodayKorean ? getTodayKorean() : "")}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:22px;">
        <div style="border:1px solid #ccd6e3;border-radius:14px;padding:22px;min-height:230px;">
          <h3 style="font-size:20px;color:#173b70;margin-top:0;">[사업주]</h3>
          <p>상호 : ${escHtml(w.companyName)}</p>
          <p>대표자 : ${escHtml(w.representative)}
            <img src="stamp.png" alt="회사 직인"
                 style="width:62px;vertical-align:middle;margin-left:8px;">
          </p>
          <p>주소 : ${escHtml(w.address)}</p>
          <p>연락처 : ${escHtml(w.phone)}</p>
        </div>

        <div style="border:1px solid #ccd6e3;border-radius:14px;padding:22px;min-height:230px;">
          <h3 style="font-size:20px;color:#173b70;margin-top:0;">[${escHtml(workerLabel)}]</h3>
          <p>성명 : ${escHtml(d.empName || "")}</p>
          <p>주민등록번호 : ${escHtml(d.residentNo || "")}</p>
          <p>생년월일 : ${escHtml(d.birth || "")}</p>
          <p>주소 : ${escHtml(d.address || "")}</p>
          <p>연락처 : ${escHtml(d.phone || "")}</p>
          <p>급여계좌 : ${escHtml(((d.bankName || d.bank || "") + " " + (d.bankAccount || d.account || "")).trim())}</p>
        </div>
      </div>
    </div>
  `;
}
