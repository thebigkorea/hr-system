const API_URL =
"https://script.google.com/macros/s/AKfycbzCO4TLMRGgt_OY-3T92mw58AAKcOwquq0ubepUEJgPO9YPeMV-hNeP7AHy7lvOPog7oQ/exec";

let allEmployees = [];

window.onload = () => {
  loadEmployees();
};

async function loadEmployees() {

  try {

    const result = await postData({
      action:"getEmployeeList"
    });

    if (!result.success) {
      alert("직원 정보를 불러오지 못했습니다.");
      return;
    }

    allEmployees = result.employees;

    renderEmployees(allEmployees);

    createDepartmentFilter(allEmployees);

  } catch(err) {

    alert(err.message);

  }
}

async function postData(data) {

  const response = await fetch(API_URL,{
    method:"POST",
    body:JSON.stringify(data)
  });

  return await response.json();
}

function renderEmployees(list) {

  const tbody =
    document.getElementById("employeeTableBody");

  tbody.innerHTML = "";

  list.forEach(emp => {

    const statusClass =
      emp.status === "재직"
      ? "active"
      : "leave";

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${emp.employeeNo}</td>
      <td>${emp.name}</td>
      <td>${emp.department}</td>
      <td>${emp.position}</td>
      <td>${emp.phone}</td>
      <td>${emp.joinDate}</td>
      <td>${emp.leaveDate || "-"}</td>

      <td>
        <span class="badge ${statusClass}">
          ${emp.status}
        </span>
      </td>

      <td>
        <div class="action-buttons">

          <button
            class="btn-cert"
            onclick="openCertificate()">
            재직증명
          </button>

          <button
            class="btn-career"
            onclick="openCareer()">
            경력증명
          </button>

          <button
            class="btn-card"
            onclick="openCard()">
            인사카드
          </button>

        </div>
      </td>
    `;

    tbody.appendChild(tr);

  });
}

function filterEmployees() {

  const keyword =
    document
    .getElementById("searchInput")
    .value
    .trim();

  const status =
    document
    .getElementById("statusFilter")
    .value;

  const department =
    document
    .getElementById("departmentFilter")
    .value;

  const filtered = allEmployees.filter(emp => {

    const matchKeyword =
      emp.name.includes(keyword);

    const matchStatus =
      !status || emp.status === status;

    const matchDepartment =
      !department || emp.department === department;

    return (
      matchKeyword &&
      matchStatus &&
      matchDepartment
    );

  });

  renderEmployees(filtered);
}

function createDepartmentFilter(list) {

  const select =
    document.getElementById("departmentFilter");

  const departments =
    [...new Set(list.map(e => e.department))];

  departments.forEach(dep => {

    if (!dep) return;

    const option =
      document.createElement("option");

    option.value = dep;
    option.innerText = dep;

    select.appendChild(option);

  });
}

function openCertificate() {
  window.open("certificate.html","_blank");
}

function openCareer() {
  window.open("career.html","_blank");
}

function openCard() {
  window.open("employee-card.html","_blank");
}