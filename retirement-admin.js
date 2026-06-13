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
function setRetirementText() {

  const type =
    document.getElementById("type").value;

  const reason =
    document.getElementById("reason");

  const recommendReason =
    document.getElementById("recommendReason");

  const agreement =
    document.getElementById("agreement");

  if (type === "자진사직") {

    reason.value =
      "본인은 개인 사정으로 인하여 퇴직을 희망하며, 본인의 자유로운 의사에 따라 사직서를 제출합니다.";

    recommendReason.value = "";

    agreement.value =
      "본인은 위 퇴직사유 및 퇴직예정일을 확인하였으며, 회사와 퇴직 관련 사항을 확인하였습니다.";
  }

  if (type === "권고사직") {

    reason.value =
      "본인은 회사와 협의한 퇴직 조건 및 퇴직예정일을 확인하였습니다.";

    recommendReason.value =
      "회사 경영상 사정 또는 인력 운영상 필요에 따라 회사가 퇴직을 권고하였고, 근로자는 이에 대해 충분히 설명을 들었습니다.";

    agreement.value =
      "본인은 회사의 권고사직 사유와 퇴직예정일을 확인하였으며, 충분한 설명을 들은 후 본인의 의사에 따라 권고사직에 동의합니다.";
  }

  if (type === "계약만료") {

    reason.value =
      "근로계약 기간 만료에 따라 퇴직 처리됨을 확인합니다.";

    recommendReason.value = "";

    agreement.value =
      "본인은 근로계약 기간 만료일 및 퇴직예정일을 확인하였습니다.";
  }

  if (type === "기타") {

    reason.value = "";
    recommendReason.value = "";
    agreement.value = "";
  }
}
function setReasonText(type) {

  document.getElementById("type").value = type;

  const reason =
    document.getElementById("reason");

  if (type === "자진사직") {
    reason.value =
      "본인은 개인 사정으로 인하여 퇴직을 희망하며, 본인의 자유로운 의사에 따라 사직서를 제출합니다.";
  }

  if (type === "권고사직") {
    reason.value =
      "본인은 회사로부터 퇴직 권고에 대한 설명을 들었으며, 퇴직예정일 및 관련 내용을 확인한 후 권고사직에 동의합니다.";
  }

  if (type === "계약만료") {
    reason.value =
      "본인은 근로계약 기간 만료에 따라 퇴직 처리됨을 확인합니다.";
  }

  if (type === "기타") {
    reason.value = "";
  }
}