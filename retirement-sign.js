const API_URL =
  "https://script.google.com/macros/s/AKfycbzhbRFVeN7NYCGSP4AJopaZRmaib_22aBTP3j3pDcQrmlgMlHe4y27XVZCzKizw4COKJg/exec";

const params =
  new URLSearchParams(location.search);

const retireId =
  params.get("id");

let canvas;
let ctx;
let drawing = false;

document.addEventListener("DOMContentLoaded", async () => {

  initSignaturePad();

  if (!retireId) {
    alert("퇴직번호가 없습니다.");
    return;
  }

  await loadRetirement();
});

async function loadRetirement() {

  try {

    const res = await fetch(
      API_URL +
      "?action=getRetirement&id=" +
      encodeURIComponent(retireId)
    );

    const json = await res.json();

    if (!json.success) {
      alert(json.message || "퇴직서를 찾지 못했습니다.");
      return;
    }

    renderRetirement(json.data);

  } catch(err) {

    alert("퇴직서 조회 중 오류가 발생했습니다.");
  }
}

function renderRetirement(data) {

  document.getElementById("loading")
    .style.display = "none";

  document.getElementById("content")
    .style.display = "block";

  setText("viewStore", data.store);
  setText("viewType", data.type);
  setText("viewName", data.name);
  setText("viewPosition", data.position);
  setText("viewJoinDate", data.joinDate);
  setText("viewRetireDate", data.retireDate);
  setText("viewPhone", data.phone);
  setText("viewReason", data.reason);

  setText(
    "viewRecommendReason",
    data.recommendReason
  );

  setText(
    "viewAgreement",
    data.agreement
  );

  setText(
    "viewCompensation",
    data.compensation
  );

  if (!data.recommendReason) {
    document.getElementById("recommendWrap")
      .style.display = "none";
  }

  if (!data.agreement) {
    document.getElementById("agreementWrap")
      .style.display = "none";
  }

  if (!data.compensation) {
    document.getElementById("compensationWrap")
      .style.display = "none";
  }
}

function setText(id, value) {
  document.getElementById(id)
    .textContent = value || "-";
}

function initSignaturePad() {

  canvas =
    document.getElementById("signaturePad");

  ctx =
    canvas.getContext("2d");

  resizeCanvas();

  window.addEventListener(
    "resize",
    resizeCanvas
  );

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
    touchStart,
    { passive:false }
  );

  canvas.addEventListener(
    "touchmove",
    touchMove,
    { passive:false }
  );

  canvas.addEventListener(
    "touchend",
    endDraw
  );
}

function resizeCanvas() {

  const rect =
    canvas.getBoundingClientRect();

  canvas.width = rect.width;
  canvas.height = rect.height;

  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#111827";
}

function startDraw(e) {

  drawing = true;

  ctx.beginPath();

  ctx.moveTo(
    e.offsetX,
    e.offsetY
  );
}

function draw(e) {

  if (!drawing) return;

  ctx.lineTo(
    e.offsetX,
    e.offsetY
  );

  ctx.stroke();
}

function endDraw() {
  drawing = false;
}

function touchStart(e) {

  e.preventDefault();

  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();

  drawing = true;

  ctx.beginPath();

  ctx.moveTo(
    touch.clientX - rect.left,
    touch.clientY - rect.top
  );
}

function touchMove(e) {

  e.preventDefault();

  if (!drawing) return;

  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();

  ctx.lineTo(
    touch.clientX - rect.left,
    touch.clientY - rect.top
  );

  ctx.stroke();
}

function clearSignature() {

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );
}

async function submitSignature() {

  const consent =
    document.getElementById("consent")
      .checked;

  if (!consent) {
    alert("내용 확인 동의가 필요합니다.");
    return;
  }

  const signature =
    canvas.toDataURL("image/png");

  if (
    signature.length < 5000
  ) {
    alert("전자서명을 입력해주세요.");
    return;
  }

  try {

    const res = await fetch(API_URL, {
      method:"POST",
      body:JSON.stringify({
        action:"signRetirement",
        retireId:retireId,
        consent:"Y",
        signature:signature
      })
    });

    const json = await res.json();

    if (!json.success) {
      alert(json.message || "서명 실패");
      return;
    }

    alert(
      "전자서명이 완료되었습니다."
    );

    location.reload();

  } catch(err) {

    alert(
      "전자서명 중 오류가 발생했습니다."
    );
  }
}