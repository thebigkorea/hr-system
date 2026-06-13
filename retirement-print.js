const API_URL =
  "https://script.google.com/macros/s/AKfycbzhbRFVeN7NYCGSP4AJopaZRmaib_22aBTP3j3pDcQrmlgMlHe4y27XVZCzKizw4COKJg/exec";

const params =
  new URLSearchParams(location.search);

const retireId =
  params.get("id");

document.addEventListener(
  "DOMContentLoaded",
  loadRetirement
);

async function loadRetirement() {

  if (!retireId) {
    alert("퇴직번호가 없습니다.");
    return;
  }

  try {

    const res = await fetch(
      API_URL +
      "?action=getRetirement&id=" +
      encodeURIComponent(retireId)
    );

    const json = await res.json();

    if (!json.success) {

      alert(
        json.message ||
        "퇴직서를 찾지 못했습니다."
      );

      return;
    }

    renderRetirement(json.data);

  } catch(err) {

    alert(
      "퇴직서 조회 중 오류가 발생했습니다."
    );
  }
}

function renderRetirement(data) {

  setText("retireId", data.retireId);
  setText("type", data.type);
  setText("store", data.store);
  setText("name", data.name);
  setText("position", data.position);
  setText("phone", data.phone);
  setText("joinDate", data.joinDate || "-");
  setText("retireDate", data.retireDate);
  setText("createdAt", data.createdAt);
  setText("signedAt", data.signedAt || "-");
  setText("reason", data.reason || "-");
  setText("manager", data.manager || "-");

  const signImg =
    document.getElementById("signature");

  if (data.signature) {

    signImg.src = data.signature;

  } else {

    signImg.style.display = "none";
  }
}

function setText(id, value) {

  const el =
    document.getElementById(id);

  if (!el) return;

  el.textContent =
    value || "-";
}