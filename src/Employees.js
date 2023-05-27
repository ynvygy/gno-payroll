import { useEffect, useState, useReducer } from "react";

const Employees = ({ payrollContract, signer, accountType }) => {
  const [permissions, setPermissions] = useState([]);
  const [permissionsState, setPermissionsState] = useState([]);
  const [editMode, setEditMode] = useState(false);

  const [employeeData, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case "SET_EMPLOYEES":
        return { ...state, employees: action.payload.employees, employeeAddresses: action.payload.employeeAddresses };
      case "SET_EMPLOYEE_COUNT":
        return { ...state, employeeCount: action.payload };
      case "UPDATE_FIELD":
        return {
          ...state,
          employees: state.employees.map((employee, index) =>
            index === action.payload.index
              ? { ...employee, [action.payload.field]: action.payload.value }
              : employee
          )
        };
      case "REMOVE_EMPLOYEE":
        return {
          ...state,
          employees: state.employees.filter((employee, index) => index !== action.payload),
          employeeCount: state.employeeCount - 1
        };
      default:
        throw new Error(`Invalid action type: ${action.type}`);
    }
  }, { employees: [], employeeCount: 0, employeeAddresses: [] });
  
  const { employees, employeeCount } = employeeData;

  const handleToggleEditMode = () => {
    setEditMode(!editMode);
  };

  useEffect(() => {
    const fetchData = async () => {
      const [employees, employeeAddresses] = await payrollContract.getEmployees();
      dispatch({ type: "SET_EMPLOYEES", payload: { employees, employeeAddresses } });
      dispatch({ type: "SET_EMPLOYEE_COUNT", payload: employees.length });
    };
    fetchData();

    const fetchPermissions = async () => {
      const permissionsz = await payrollContract.getPermissions();
      setPermissions(permissionsz[0]);
      setPermissionsState(permissionsz[1]);
    };
    fetchPermissions();
    console.log(permissions)
  }, [payrollContract]);
  
  const handleInputChange = (e, index, field) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    console.log(employees)
    dispatch({ type: "UPDATE_FIELD", payload: { index, field, value } });
  };

  const handleRemove = async (index) => {
    const employeeAddress = employeeData.employeeAddresses[index];
    const tx = await payrollContract.connect(signer).removeEmployee(employeeAddress);
    await tx.wait();
    dispatch({ type: "REMOVE_EMPLOYEE", payload: index });
    dispatch({ type: "SET_EMPLOYEE_COUNT", payload: employeeCount - 1 });
  };

  const handleUpdate = async (index) => {
    const employee = employeeData.employees[index];
    const employeeAddress = employeeData.employeeAddresses[index];
    const tx = await payrollContract.connect(signer).updateEmployee(employeeAddress, employee.name, employee.age, employee.salary, employee.contractor, employee.country, employee.isHr);
    await tx.wait();
    const [employees, employeeAddresses] = await payrollContract.getEmployees();
    dispatch({ type: "SET_EMPLOYEES", payload: { employees, employeeAddresses } });
  };

  return (
    <div>
      <div>Employee count: {employeeCount}</div>
      <h2>Employees</h2>
      <div className="button-toggle">
        {editMode ? (
          <button onClick={handleToggleEditMode} className="exit-button">
            Exit edit mode
          </button>
        ) : (          
          <button onClick={handleToggleEditMode} className="employees-button">
            Enter edit mode
          </button>
        )}
      </div>
      {employees && employees.length > 0 ? (
        editMode ? (
          <table className="excel-style">
            <thead>
              <tr>
                <th>Address</th>
                <th>Name</th>
                <th>Age</th>
                <th>Salary</th>
                <th>Contractor</th>
                <th>Country</th>
                <th>Is HR</th>
                <th>Update/Remove</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee, index) => (
                <tr key={index} className="employees-table">
                  <td>{employeeData.employeeAddresses[index]}</td>
                  <td><input type="text" value={employee.name} onChange={(e) => handleInputChange(e, index, 'name')} className="employees-text"/></td>
                  <td><input type="number" value={employee.age} onChange={(e) => handleInputChange(e, index, 'age')} className="employees-text"/></td>
                  <td><input type="number" value={employee.salary} onChange={(e) => handleInputChange(e, index, 'salary')} className="employees-text"/></td>
                  <td><input type="checkbox" checked={employee.contractor} onChange={(e) => handleInputChange(e, index, 'contractor')} className="employees-checkbox"/></td>
                  <td><input type="text" value={employee.country} onChange={(e) => handleInputChange(e, index, 'country')} className="employees-text"/></td>
                  <td><input type="checkbox" checked={employee.isHr} onChange={(e) => handleInputChange(e, index, 'isHr')} className="employees-checkbox"/></td>
                  <td>
                    {accountType == "Gnowner" || (accountType == "HR" && permissionsState[2]) ? <button className="employees-button" onClick={() => handleUpdate(index)}>Update</button> : <></>}
                    {accountType == "Gnowner" || (accountType == "HR" && permissionsState[1]) ? <button className="exit-button" onClick={() => handleRemove(index)}>Remove</button> : <></>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="standard-style width-95">
            <thead>
              <tr>
                <th>Address</th>
                <th>Name</th>
                <th>Age</th>
                <th>Salary</th>
                <th>Contractor</th>
                <th>Country</th>
                <th>Is HR</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee, index) => (
                <tr key={index} className="employees-table">
                  <td>{employeeData.employeeAddresses[index]}</td>
                  <td>{employee.name}</td>
                  <td>{employee.age.toString()}</td>
                  <td>{employee.salary.toString()}</td>
                  <td>{employee.contractor ? 'Yes' : 'No'}</td>
                  <td>{employee.country}</td>
                  <td>{employee.isHr ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      ) : (
        <div>Loading employees...</div>
      )}
    </div>
  );
};

export default Employees;
