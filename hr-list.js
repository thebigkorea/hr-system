const API_URL =
  "https://script.google.com/macros/s/AKfycbzCO4TLMRGgt_OY-3T92mw58AAKcOwquq0ubepUEJgPO9YPeMV-hNeP7AHy7lvOPog7oQ/exec";

let allEmployees = [];

window.onload = function () {
  loadEmployeesOnly();
};

async function loadEmployeesOnly() {
  const tbody = document.getElementById("employeeTableBody");

  try {
    const result = await postData({
      action: "getEmployeeList"
    });

    if (!result.success) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9">${result.message || "직원 정보를 불러오지 못했습니다."}</td>
        </tr>
      `;
      return;
    }

    allEmployees = result.employees || [];
    createDepartmentFilter(allEmployees);
    clearTableMessage();

  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9">오류가 발생했습니다: ${err.message}</td>
      </tr>
    `;
  }
}

async function postData(data) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(data)
  });

  return await response.json();
}

function searchEmployee() {
  const dept = document.getElementById("deptFilter").value;
  const status = document.getElementById("statusFilter").value;
  const keyword = document.getElementById("searchInput").value.trim();

  const filtered = allEmployees.filter(emp => {
    const department = emp.department || "";
    const empStatus = emp.status || "";
    const name = emp.name || "";

    const matchDept = dept === "all" || department === dept;
    const matchStatus = status === "all" || empStatus === status;
    const matchKeyword = keyword === "" || name.includes(keyword);

    return matchDept && matchStatus && matchKeyword;
  });

  renderEmployees(filtered);
}

function renderEmployees(list) {
  const tbody = document.getElementById("employeeTableBody");
  tbody.innerHTML = "";

  if (!list || list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9">조회된 직원이 없습니다.</td>
      </tr>
    `;
    return;
  }

  list.forEach(emp => {
    const statusText = emp.status || "";
    const isActive = statusText.includes("재직");

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${emp.employeeNo || ""}</td>
      <td>${emp.name || ""}</td>
      <td>${emp.department || ""}</td>
      <td>${emp.position || ""}</td>
      <td>${emp.phone || ""}</td>
      <td>${emp.joinDate || ""}</td>
      <td>${emp.leaveDate || "-"}</td>
      <td>
        <span class="badge ${isActive ? "active" : "leave"}">
          ${statusText || "-"}
        </span>
      </td>
      <td>
        <div class="doc-buttons">
          <button class="btn-cert" onclick="openCertificate()">재직증명</button>
          <button class="btn-career" onclick="openCareer()">경력증명</button>
          <button class="btn-card" onclick="openCard()">인사카드</button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function resetSearch() {
  document.getElementById("deptFilter").value = "all";
  document.getElementById("statusFilter").value = "all";
  document.getElementById("searchInput").value = "";

  clearTableMessage();
}

function clearTableMessage() {
  document.getElementById("employeeTableBody").innerHTML = `
    <tr>
      <td colspan="9">조회 조건을 선택한 뒤 조회 버튼을 눌러주세요.</td>
    </tr>
  `;
}

function createDepartmentFilter(list) {
  const select = document.getElementById("deptFilter");

  select.innerHTML = `<option value="all">전체 매장</option>`;

  const departments = [...new Set(
    list
      .map(emp => emp.department)
      .filter(dep => dep && String(dep).trim() !== "")
  )];

  departments.forEach(dep => {
    const option = document.createElement("option");
    option.value = dep;
    option.innerText = dep;
    select.appendChild(option);
  });
}

function openCertificate() {
  window.open("certificate.html", "_blank");
}

function openCareer() {
  window.open("career.html", "_blank");
}

function openCard() {
  window.open("employee-card.html", "_blank");
}