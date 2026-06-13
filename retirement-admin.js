const API_URL =
  "https://script.google.com/macros/s/AKfycbzhbRFVeN7NYCGSP4AJopaZRmaib_22aBTP3j3pDcQrmlgMlHe4y27XVZCzKizw4COKJg/exec";

async function createRetirement() {

  const btn =
    document.querySelector(".primary");

  btn.disabled = true;
  btn.textContent = "생성 중...";

  const data = {
    action: "createRetirement",

    store:
      document.getElementById("store").value,

    type:
      document.getElementById("type").value,

    name:
      document.getElementById("name").value.trim(),

    position:
      document.getElementById("position").value.trim(),

    joinDate:
      document.getElementById("joinDate").value,

    retireDate:
      document.getElementById("retireDate").value,

    phone:
      document.getElementById("phone").value.trim(),

    reason:
      document.getElementById("reason").value.trim(),

    recommendReason:
      document.getElementById("recommendReason").value.trim(),

    agreement:
      document.getElementById("agreement").value.trim(),

    compensation:
      document.getElementById("compensation").value.trim(),

    manager:
      document.getElementById("manager").value.trim()
  };

  if (!data.store) {
    alert("점포를 선택해주세요.");
    resetBtn();
    return;
  }

  if (!data.type) {
    alert("퇴직유형을 선택해주세요.");
    resetBtn();
    return;
  }

  if (!data.name) {
    alert("성명을 입력해주세요.");
    resetBtn();
    return;
  }

  if (!data.retireDate) {
    alert("퇴직예정일을 입력해주세요.");
    resetBtn();
    return;
  }

  if (!data.phone) {
    alert("연락처를 입력해주세요.");
    resetBtn();
    return;
  }

  try {

    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(data)
    });

    const json = await res.json();

    if (!json.success) {
      alert(json.message || "생성 실패");
      resetBtn();
      return;
    }

    renderResult(json);

  } catch(err) {

    alert(
      "퇴직서 생성 중 오류가 발생했습니다."
    );
  }

  resetBtn();
}

function renderResult(data) {

  const box =
    document.getElementById("resultBox");

  box.innerHTML = `
    <div>

      <strong>
        퇴직서 생성 완료
      </strong>

      <div class="link-box">

        <div>
          퇴직번호:
          ${data.retireId}
        </div>

        <br>

        <div>
          직원 서명 링크
        </div>

        <br>

        <a href="${data.signLink}"
           target="_blank">

          ${data.signLink}

        </a>

        <button class="copy-btn"
                onclick="copyLink('${data.signLink}')">

          링크 복사
        </button>

      </div>

    </div>
  `;
}

async function copyLink(link) {

  try {

    await navigator.clipboard.writeText(link);

    alert("링크가 복사되었습니다.");

  } catch(err) {

    alert("복사 실패");
  }
}

function resetBtn() {

  const btn =
    document.querySelector(".primary");

  btn.disabled = false;
  btn.textContent = "퇴직서 생성";
}