import React, { useState, useEffect } from 'react';

const EmployeeReport = ({payrollContract, signer}) => {
  const [salary, setSalary] = useState("");

  useEffect(() => {
    async function getSalary() {
      const getSalary = await payrollContract.getEmployeeSalary();
      setSalary(getSalary.toString())
    }
    getSalary();
  }, [payrollContract]);

  return (
    <div>
      {salary}
    </div>
  );
};

export default EmployeeReport;
